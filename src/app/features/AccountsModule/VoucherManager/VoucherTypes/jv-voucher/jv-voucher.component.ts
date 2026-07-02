import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { AutoDropdown } from '../../../../../Models/Pagination.model';
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

import { CurrencyDto } from '../../../../../Models/Auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { voucherMangerService } from '../../../../../services/Accounting/voucherManger.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-jv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './jv-voucher.component.html',
  styleUrl: './jv-voucher.component.css',
})
export class JvVoucherComponent {

  //Initial Call
  currencies = signal<CurrencyDto[]>([]);

  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private voucherMangerService = inject(voucherMangerService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  voucherTypes = signal(enumToOptions(VoucherType, true));
  isEditMode = signal<boolean>(false);

  //Load Voucher for Edit Mode
  ngOnInit() {
    this.loadCurrencies();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadJv(id);
        }
      });
  }


  //Computed Totals
  totalDebit = computed(() =>
    this.journalModel().lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.journalModel().lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  );

  baseTotalDebit = computed(() =>
    this.journalModel().lines.reduce(
      (sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  baseTotalCredit = computed(() =>
    this.journalModel().lines.reduce(
      (sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  //for Global Search
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/VoucherAccounts');
  coaSearchList = this.coaSearch.result;

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

  //Intialize Main Object
  private readonly jvModel: JournalEntryDto = {
    voucherType: VoucherType.Journal,
    postingDateUI: new Date(),
    postingDate: '',
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: null,
    lines: [{ ...this.jvLines }]
  };

  //Intialize Main Object with Signal
  journalModel = signal<JournalEntryDto>(this.jvModel);

  //validations
  journalForm = form(this.journalModel, (schema) => {
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

      // ✅ Cross-field validation attached to ONE field
      validate(line.debit, ({ value, valueOf }) => {
        const debit = value();
        const credit = valueOf(line.credit);

        if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
          return {
            kind: 'debitCredit',
            message: 'Enter either Debit OR Credit'
          };
        }

        return null;
      });
    });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof JournalEntryDto>(field: K, value: JournalEntryDto[K]) {
    this.journalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof JournalEntryLineDto>(
    index: number,
    field: K,
    value: JournalEntryLineDto[K]
  ) {
    this.journalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {

    const index = this.journalModel().lines.length - 1;
    const line = this.journalForm.lines[index];

    //Mark required field 
    const isInvalid = line.chartOfAccountId().invalid() || line.debit().invalid() || line.credit().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.chartOfAccountId().markAsTouched();
      line.debit().markAsTouched();
      line.credit().markAsTouched();

      return;
    }

    //Generate Next Line Smartly
    const defaults = this.voucherMangerService.generateSmartLines(this.journalModel().lines, VoucherType.Journal);
    const newLine = { ...this.jvLines, ...defaults };


    this.journalModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, { ...newLine }]
    }));
  }

  // ✅ Delete a line by index
  deleteLine(index: number): void {
    const lines = this.journalModel().lines;

    if (lines.length === 1) {
      // reset instead of delete
      this.journalModel.update(prev => ({
        ...prev,
        lines: [{ ...this.jvLines }]
      }));
      return;
    }

    this.journalModel.update(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  }

  //Create method
  createJV(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.journalForm().invalid()) {
      this.journalForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Checking Business Logical Errors
    const errors = this.voucherMangerService.validate(this.journalModel().lines);
    if (errors.length > 0) {
      this.errors.set(errors);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.journalForm().value() as JournalEntryDto;
    formvalue.postingDate = toDateOnlyString(formvalue.postingDateUI) ?? '';

    // Extract raw ID from autocomplete object (since optionValue is no longer used)
    formvalue.lines = formvalue.lines.map(line => ({
      ...line,
      chartOfAccountId: (line.chartOfAccountId as any)?.id ?? line.chartOfAccountId
    }));

    //for update and create
    const url = `VoucherManager/jv`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<JournalEntryDto>(url, formvalue.id?.toString() ?? '', formvalue)
      : this.dataService.create<JournalEntryDto>(url, formvalue);

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
        this.journalForm().reset({ ...this.jvModel, lines: [{ ...this.jvLines }] });
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

  loadJv(id: string) {
    this.dataService.getById<JournalEntryDto>('VoucherManager', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {

        //Bind selected Account Id with Auto complete
        data.lines.forEach(line => {
          line.selectedAccounts = {
            id: line.chartOfAccountId!,
            name: line.accountName
          };
        });

        this.coaSearch.setInitialValue(
          data.lines.map(x => x.selectedAccounts!)
        );

        data.postingDateUI = new Date(data.postingDate);

        // Set chartOfAccountId to the full object so autocomplete can display the name
        this.journalModel.set(data)
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Accounts', 'voucherList']);
      }
    });
  }


}
