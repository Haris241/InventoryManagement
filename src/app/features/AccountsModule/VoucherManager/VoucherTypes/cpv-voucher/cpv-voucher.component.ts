import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { DataLayerService } from '../../../../../services/data-layer.service';
import { BaseApiService } from '../../../../../services/base-api.service';
import { JournalEntryDto, JournalEntryLineDto, JournalCategory, SourceType, VoucherType } from '../../../../../Models/Accouting/VoucherManager.model';
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
  selector: 'app-cpv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './cpv-voucher.component.html',
  styleUrl: './cpv-voucher.component.css',
})
export class CpvVoucherComponent {
  //Initial Call
  currencies = signal<CurrencyDto[]>([]);
  cashUsageAccounts = signal<AutoDropdown[]>([]);


  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private voucherMangerService = inject(voucherMangerService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal<boolean>(false);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  voucherTypes = signal(enumToOptions(VoucherType, true));

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadCashUsageAccounts();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadCPV(id);
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

  //Load Cash Usage Acccounts
  loadCashUsageAccounts(): void {
    this.dataService.getAll<AutoDropdown[]>("AccountsDropDown/CashUsageAccounts").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.cashUsageAccounts.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }


  //Computed Totals
  totalDebit = computed(() =>
    this.cashJournalModel().lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.cashJournalModel().lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  );

  baseTotalDebit = computed(() =>
    this.cashJournalModel().lines.reduce(
      (sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  baseTotalCredit = computed(() =>
    this.cashJournalModel().lines.reduce(
      (sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)),
      0
    )
  );



  //for Global Search
  cashCoa = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/NonBankCashAccounts');
  cashCoaSearchList = this.cashCoa.result;

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

  //Intialize Main Object..The Lines are Multipe ...one for Cash and one for Other
  private readonly crvModel: JournalEntryDto = {
    voucherType: VoucherType.CashPayment,
    postingDateUI: new Date(),
    postingDate: '',
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: null,
    lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }]
  };

  //Intialize Main Object with Signal
  cashJournalModel = signal<JournalEntryDto>(this.crvModel);


  //validations
  cpvForm = form(this.cashJournalModel, (schema) => {
    // Root validations
    required(schema.voucherType, { message: 'Voucher Type is required' });
    required(schema.postingDateUI, { message: 'Posting Date is required' });
    required(schema.category, { message: 'Category is required' });
    required(schema.narration, { message: 'Narration is required' });

    // Nested lines validation
    applyEach(schema.lines, (line) => {
      required(line.chartOfAccountId, { message: 'Account is required' });
      min(line.debit, 0, { message: 'Debit must be >= 0' });
      min(line.credit, 0, { message: 'Credit must be >= 0' });

      // ✅ Validation for cpv for credit and debit
      validate(line.credit, ({ value, valueOf }) => {

        if (valueOf(line.isMainLine) && Number(value() ?? 0) <= 0) {
          return {
            kind: 'cashCredit',
            message: 'Cash Credit is required'
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
  updateField<K extends keyof JournalEntryDto>(field: K, value: JournalEntryDto[K]) {
    this.cashJournalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof JournalEntryLineDto>(index: number, field: K, value: JournalEntryLineDto[K]) {
    this.cashJournalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {

    const index = this.cashJournalModel().lines.length - 1;
    const line = this.cpvForm.lines[index];

    //Mark required field 
    const isInvalid = line.chartOfAccountId().invalid() || line.debit().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.chartOfAccountId().markAsTouched();
      line.debit().markAsTouched();

      return;
    }
    //Generate Next Line Smartly
    const defaults = this.voucherMangerService.generateSmartLines(this.cashJournalModel().lines, VoucherType.CashPayment);
    const newLine = { ...this.jvLines, ...defaults };

    this.cashJournalModel.update(prev => ({
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

    const lines = this.cashJournalModel().lines;
    //Make sure it is starting from next line
    if (lines.length === 2) {
      this.cashJournalModel.update(prev => ({
        ...prev,
        lines: [
          prev.lines[0], // keep bank line
          { ...this.jvLines, isMainLine: false }
        ]
      }));
      return;
    }

    this.cashJournalModel.update(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  }

  //Create method
  createCPV(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.cpvForm().invalid()) {
      this.cpvForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Checking Business Logical Errors
    const errors = this.voucherMangerService.validate(this.cashJournalModel().lines);
    if (errors.length > 0) {
      this.errors.set(errors);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.cpvForm().value() as JournalEntryDto;
    formvalue.postingDate = toDateOnlyString(formvalue.postingDateUI) ?? '';

    //for update and create
    const url = `VoucherManager/cpv`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<JournalEntryDto>(url, formvalue.id?.toString() ?? '', formvalue)
      : this.dataService.create<JournalEntryDto>(url, formvalue);


    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Voucher Posted Successfully', false);
        //Reset the form
        this.cpvForm().reset({ ...this.crvModel, lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: false }] });
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

  loadCPV(id: string) {
    this.dataService.getById<JournalEntryDto>('VoucherManager', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {

        //Bind selected Account Id with Auto complete
        data.lines.forEach(line => {
          line.selectedAccounts = {
            id: line.chartOfAccountId!,
            name: line.accountName
          };
        });

        this.cashCoa.setInitialValue(
          data.lines.map(x => x.selectedAccounts!)
        );

        data.postingDateUI = new Date(data.postingDate);

        this.cashJournalModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Accounts', 'voucherList']);
      }
    });
  }

}
