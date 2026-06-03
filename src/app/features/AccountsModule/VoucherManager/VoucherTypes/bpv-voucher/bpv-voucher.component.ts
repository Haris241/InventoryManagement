import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { DataLayerService } from '../../../../../services/data-layer.service';
import { BaseApiService } from '../../../../../services/base-api.service';
import { ChequeStatus, CreateBankVoucher, CreateJournalEntry, CreateJournalEntryLine, JournalCategory, SourceType, VoucherType } from '../../../../../Models/Accouting/VoucherManager.model';
import { applyEach, form, FormField, min, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FieldErrorSComponent } from "../../../../../shared/field-error-s/field-error-s.component";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { enumToOptions, toDateOnlyString } from '../../../../../shared/Utility';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginationService } from '../../../../../services/pagination.service';
import { AutoDropdown } from '../../../../../Models/Pagination.model';
import { CurrencyDto } from '../../../../../Models/Auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { voucherMangerService } from '../../../../../services/Accounting/voucherManger.service';

@Component({
  selector: 'app-bpv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './bpv-voucher.component.html',
  styleUrl: './bpv-voucher.component.css',
})
export class BpvVoucherComponent {
  //Initial Call
  currencies = signal<CurrencyDto[]>([]);
  bankUsageAccounts = signal<AutoDropdown[]>([]);

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadBankUsageAccounts();
  }

  loadCurrencies(): void {
    this.dataService.getAll<CurrencyDto[]>("Dropdowns/Currencies").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.currencies.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  //Load Bank Usage Acccounts
  loadBankUsageAccounts(): void {
    this.dataService.getAll<AutoDropdown[]>("AccountsDropDown/BankUsageAccounts").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.bankUsageAccounts.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }
  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private voucherMangerService = inject(voucherMangerService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  voucherTypes = signal(enumToOptions(VoucherType, true));
  chequeStatuses = signal(enumToOptions(ChequeStatus, true));

  //Computed Totals
  totalDebit = computed(() =>
    this.bankbankJournalModel().lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.bankbankJournalModel().lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  );

  baseTotalDebit = computed(() =>
    this.bankbankJournalModel().lines.reduce(
      (sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  baseTotalCredit = computed(() =>
    this.bankbankJournalModel().lines.reduce(
      (sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)),
      0
    )
  );



  //for Global Search
  nonBankCoa = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/NonBankCashAccounts');
  nonBankCoaSearchList = this.nonBankCoa.result;

  //Initialize Lines
  private readonly jvLines: CreateJournalEntryLine = {
    chartOfAccountId: null,
    description: '',
    debit: 0,
    credit: 0,
    currencyCode: '',
    exchangeRate: 1,
    relatedEntityId: null,
    referenceNo: '',
    isMainLine: false
  };

  //Intialize Main Object..The Lines are Multipe ...one for Bank and one for Other
  private readonly bpvModel: CreateBankVoucher = {
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    chequeNumber: '',
    chequeDate: null,
    chequeDateUI: null,
    chequeStatus: null,
    paymentMode: '',
    voucherType: VoucherType.BankPayment,
    postingDateUI: new Date(),
    postingDate: '',
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: null,
    lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }]
  };

  //Intialize Main Object with Signal
  bankbankJournalModel = signal<CreateBankVoucher>(this.bpvModel);


  //validations
  bpvForm = form(this.bankbankJournalModel, (schema) => {
    // Root validations
    required(schema.bankName, { message: 'Bank Name is required' });
    required(schema.bankAccountNumber, { message: 'Bank Account Number is required' });
    required(schema.voucherType, { message: 'Voucher Type is required' });
    required(schema.postingDateUI, { message: 'Posting Date is required' });
    required(schema.category, { message: 'Category is required' });
    required(schema.narration, { message: 'Narration is required' });

    // Nested lines validation
    applyEach(schema.lines, (line) => {
      required(line.chartOfAccountId, { message: 'Account is required' });
      min(line.debit, 0, { message: 'Debit must be >= 0' });
      min(line.credit, 0, { message: 'Credit must be >= 0' });

      // ✅ Validation for bpv for credit and debit
      validate(line.credit, ({ value, valueOf }) => {

        if (valueOf(line.isMainLine) && Number(value() ?? 0) <= 0) {
          return {
            kind: 'bankCredit',
            message: 'Bank line credit is required'
          };
        }

        return null;
      });

      validate(line.debit, ({ value, valueOf }) => {

        if (!valueOf(line.isMainLine) && Number(value() ?? 0) <= 0) {
          return {
            kind: 'expenseDebit',
            message: 'Debit is required'
          };
        }

        return null;
      });
    });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CreateBankVoucher>(field: K, value: CreateBankVoucher[K]) {
    this.bankbankJournalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof CreateJournalEntryLine>(index: number, field: K, value: CreateJournalEntryLine[K]) {
    this.bankbankJournalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {

    const index = this.bankbankJournalModel().lines.length - 1;
    const line = this.bpvForm.lines[index];

    //Mark required field 
    const isInvalid = line.chartOfAccountId().invalid() || line.debit().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.chartOfAccountId().markAsTouched();
      line.debit().markAsTouched();

      return;
    }

    this.bankbankJournalModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, { ...this.jvLines }]
    }));
  }

  // ✅ Delete a line by index
  deleteLine(index: number): void {

    //Protecting Deleting Bank Line
    if (index === 0) {
      return;
    }

    const lines = this.bankbankJournalModel().lines;
    //Make sure it is starting from next line
    if (lines.length === 2) {
      this.bankbankJournalModel.update(prev => ({
        ...prev,
        lines: [
          prev.lines[0], // keep bank line
          { ...this.jvLines, isMainLine: false }
        ]
      }));
      return;
    }

    this.bankbankJournalModel.update(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  }

  //Create method
  createBPV(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.bpvForm().invalid()) {
      this.bpvForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Checking Business Logical Errors
    const errors = this.voucherMangerService.validate(this.bankbankJournalModel().lines);
    if (errors.length > 0) {
      this.errors.set(errors);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.bpvForm().value() as CreateBankVoucher;
    formvalue.postingDate = toDateOnlyString(formvalue.postingDateUI);

    //Making Api Call
    this.dataService.create<CreateBankVoucher>('VoucherManager/bpv', formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Voucher Posted Successfully', false);
        //Reset the form
        this.bpvForm().reset({ ...this.bpvModel, lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }] });
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        if (err.error.errors) {
          this.backendErrors.set(err.error.errors);
        } else {
          this.base.handleError(err, err.error.message);
        }
        this.submit.set(false);
      }
    });

  }

  //Global Search
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

}
