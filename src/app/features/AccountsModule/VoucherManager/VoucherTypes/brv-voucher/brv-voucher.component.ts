import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { DataLayerService } from '../../../../../services/data-layer.service';
import { BaseApiService } from '../../../../../services/base-api.service';
import { ChequeStatus, BankVoucherDto, JournalEntryDto, JournalEntryLineDto, JournalCategory, SourceType, VoucherType } from '../../../../../Models/Accouting/VoucherManager.model';
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
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-brv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './brv-voucher.component.html',
  styleUrl: './brv-voucher.component.css',
})
export class BrvVoucherComponent {
  //Initial Call
  currencies = signal<CurrencyDto[]>([]);
  bankUsageAccounts = signal<AutoDropdown[]>([]);


  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private voucherMangerService = inject(voucherMangerService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  voucherTypes = signal(enumToOptions(VoucherType, true));
  chequeStatuses = signal(enumToOptions(ChequeStatus, true));


  ngOnInit(): void {
    this.loadCurrencies();

    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadBankUsageAccounts(id);  // ← pass id here
        } else {
          this.loadBankUsageAccounts();    // ← create mode, no id
        }
      });

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
  loadBankUsageAccounts(editId?: string): void {
    this.dataService.getAll<AutoDropdown[]>("AccountsDropDown/BankUsageAccounts").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.bankUsageAccounts.set(res);
        // ── If edit mode, load voucher only after accounts are ready ──
        if (editId) {
          this.loadBRV(editId);
        }
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  //Computed Totals
  totalDebit = computed(() =>
    this.bankJournalModel().lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.bankJournalModel().lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  );

  baseTotalDebit = computed(() =>
    this.bankJournalModel().lines.reduce(
      (sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  baseTotalCredit = computed(() =>
    this.bankJournalModel().lines.reduce(
      (sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)),
      0
    )
  );



  //for Global Search
  nonBankCoa = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/NonBankCashAccounts');
  nonBankCoaSearchList = this.nonBankCoa.result;

  //Initialize Lines
  private readonly jvLines: JournalEntryLineDto = {
    chartOfAccountId: null,
    description: '',
    debit: 0,
    credit: 0,
    currencyCode: null,
    accountName: '',
    exchangeRate: 1,
    relatedEntityId: null,
    referenceNo: '',
    isMainLine: false
  };

  //Intialize Main Object..The Lines are Multipe ...one for Bank and one for Other
  private readonly brvModel: BankVoucherDto = {
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    chequeNumber: '',
    chequeDate: '',
    chequeDateUI: null,
    chequeStatus: null,
    paymentMode: '',
    voucherType: VoucherType.BankReceipt,
    postingDateUI: new Date(),
    postingDate: '',
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: null,
    lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }]
  };

  //Intialize Main Object with Signal
  bankJournalModel = signal<BankVoucherDto>(this.brvModel);


  //validations
  brvForm = form(this.bankJournalModel, (schema) => {
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

      // ✅ Validation for brv for credit and debit
      validate(line.debit, ({ value, valueOf }) => {

        if (valueOf(line.isMainLine) && Number(value() ?? 0) <= 0) {
          return {
            kind: 'bankDebit',
            message: 'Bank line debit is required'
          };
        }

        return null;
      });

      validate(line.credit, ({ value, valueOf }) => {

        if (!valueOf(line.isMainLine) && Number(value() ?? 0) <= 0) {
          return {
            kind: 'expenseCredit',
            message: 'Credit is required'
          };
        }

        return null;
      });
    });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof BankVoucherDto>(field: K, value: BankVoucherDto[K]) {
    this.bankJournalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof JournalEntryLineDto>(index: number, field: K, value: JournalEntryLineDto[K]) {
    this.bankJournalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {

    const index = this.bankJournalModel().lines.length - 1;
    const line = this.brvForm.lines[index];

    //Mark required field 
    const isInvalid = line.chartOfAccountId().invalid() || line.credit().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.chartOfAccountId().markAsTouched();
      line.credit().markAsTouched();

      return;
    }

    //Generate Next Line Smartly
    const defaults = this.voucherMangerService.generateSmartLines(this.bankJournalModel().lines, VoucherType.BankReceipt);
    const newLine = { ...this.jvLines, ...defaults };

    this.bankJournalModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  }

  // ✅ Delete a line by index
  deleteLine(index: number): void {

    //Protecting Deleting Bank Line
    if (index === 0) {
      return;
    }

    const lines = this.bankJournalModel().lines;
    //Make sure it is starting from next line
    if (lines.length === 2) {
      this.bankJournalModel.update(prev => ({
        ...prev,
        lines: [
          prev.lines[0], // keep bank line
          { ...this.jvLines, isMainLine: false }
        ]
      }));
      return;
    }

    this.bankJournalModel.update(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  }

  //Create method
  createBRV(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.brvForm().invalid()) {
      this.brvForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Checking Business Logical Errors
    const errors = this.voucherMangerService.validate(this.bankJournalModel().lines);
    if (errors.length > 0) {
      this.errors.set(errors);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.brvForm().value() as BankVoucherDto;
    formvalue.postingDate = toDateOnlyString(formvalue.postingDateUI) ?? '';
    formvalue.chequeDate = toDateOnlyString(formvalue.chequeDateUI) ?? '';

    //for update and create
    const url = `VoucherManager/brv`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<BankVoucherDto>(url, formvalue.id?.toString() ?? '', formvalue)
      : this.dataService.create<BankVoucherDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Accounts', 'voucherList']);
          this.base.globalMessage('success', 'Voucher Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Voucher Posted Successfully', false);
        //Reset the form
        this.brvForm().reset({ ...this.brvModel, lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }] });
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
  loadBRV(id: string) {
    this.dataService.getById<BankVoucherDto>('VoucherManager', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {

        // ── Find main line: must be in cashUsageAccounts AND have debit > 0 ──
        const cashAccountIds = new Set(this.bankUsageAccounts().map(a => a.id));

        const mainLineIndex = data.lines.findIndex(line =>
          cashAccountIds.has(line.chartOfAccountId!) && line.debit > 0
        );

        // ── Guard: if no valid main line found, voucher is corrupted ──
        if (mainLineIndex === -1) {
          this.base.globalMessage('error', 'This voucher cannot be edited. The cash account may have been reconfigured.', false);
          this.router.navigate(['Accounts', 'voucherList']);
          return;
        }

        // ── Reorder: main line first, rest follow ──
        const mainLine = data.lines[mainLineIndex];
        const otherLines = data.lines.filter((_, i) => i !== mainLineIndex);
        data.lines = [mainLine, ...otherLines];

        // ── Mark isMainLine ──
        data.lines.forEach((line, index) => {
          line.isMainLine = index === 0;

          line.selectedAccounts = {
            id: line.chartOfAccountId!,
            name: line.accountName
          };
        });

        this.nonBankCoa.setInitialValue(
          data.lines.filter(l => !l.isMainLine).map(l => l.selectedAccounts!)
        );

        data.postingDateUI = new Date(data.postingDate);
        data.chequeDateUI = new Date(data.chequeDate);

        this.bankJournalModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Accounts', 'voucherList']);
      }
    });
  }
}
