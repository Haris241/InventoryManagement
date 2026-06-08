import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { DataLayerService } from '../../../../../services/data-layer.service';
import { BaseApiService } from '../../../../../services/base-api.service';
import { CreateJournalEntry, CreateJournalEntryLine, JournalCategory, SourceType, VoucherType } from '../../../../../Models/Accouting/VoucherManager.model';
import { applyEach, form, FormField, min, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FieldErrorSComponent } from "../../../../../shared/field-error-s/field-error-s.component";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { enumToOptions, toDateOnlyString } from '../../../../../shared/Utility';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AutoDropdown } from '../../../../../Models/Pagination.model';
import { CurrencyDto } from '../../../../../Models/Auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { voucherMangerService } from '../../../../../services/Accounting/voucherManger.service';

@Component({
  selector: 'app-cv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './cv-voucher.component.html',
  styleUrl: './cv-voucher.component.css',
})
export class CvVoucherComponent {
  //Initial Call
  currencies = signal<CurrencyDto[]>([]);
  cashBankUsageAccounts = signal<AutoDropdown[]>([]);

  ngOnInit(): void {
    this.loadCurrencies();
    this.loadCashUsageAccounts();
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
    this.dataService.getAll<AutoDropdown[]>("AccountsDropDown/CashBankAccounts").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.cashBankUsageAccounts.set(res);
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
  private voucherMangerService = inject(voucherMangerService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  voucherTypes = signal(enumToOptions(VoucherType, true));


  //Computed Totals
  totalDebit = computed(() =>
    this.contraJournalModel().lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.contraJournalModel().lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  );

  baseTotalDebit = computed(() =>
    this.contraJournalModel().lines.reduce(
      (sum, l) => sum + ((l.debit || 0) * (l.exchangeRate || 1)),
      0
    )
  );

  baseTotalCredit = computed(() =>
    this.contraJournalModel().lines.reduce(
      (sum, l) => sum + ((l.credit || 0) * (l.exchangeRate || 1)),
      0
    )
  );


  //Initialize Lines
  private readonly jvLines: CreateJournalEntryLine = {
    chartOfAccountId: null,
    description: '',
    debit: 0,
    credit: 0,
    currencyCode: null,
    exchangeRate: 1,
    relatedEntityId: null,
    referenceNo: '',
    isMainLine: false
  };

  //Intialize Main Object..The Lines are Multipe ...one for Cash and one for Other
  private readonly cvModel: CreateJournalEntry = {
    voucherType: VoucherType.Contra,
    postingDateUI: new Date(),
    postingDate: '',
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: null,
    lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: true }]
  };

  //Intialize Main Object with Signal
  contraJournalModel = signal<CreateJournalEntry>(this.cvModel);


  //validations
  cvForm = form(this.contraJournalModel, (schema) => {
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

      // ✅ Validation for cv for credit and debit
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
  updateField<K extends keyof CreateJournalEntry>(field: K, value: CreateJournalEntry[K]) {
    this.contraJournalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof CreateJournalEntryLine>(index: number, field: K, value: CreateJournalEntryLine[K]) {
    this.contraJournalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  //Create method
  createCV(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.cvForm().invalid()) {
      this.cvForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Checking Business Logical Errors
    const errors = this.voucherMangerService.validate(this.contraJournalModel().lines);
    if (errors.length > 0) {
      this.errors.set(errors);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }
    if (this.contraJournalModel().lines[0].chartOfAccountId == this.contraJournalModel().lines[1].chartOfAccountId) {
      this.errors.set(["From and To Account cannot be Same"]);
      this.submit.set(false);
      this.formSubmitted.set(false);
      return;
    }
    //Accessing Form Valu.e
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.cvForm().value() as CreateJournalEntry;
    formvalue.postingDate = toDateOnlyString(formvalue.postingDateUI);

    //Making Api Call
    this.dataService.create<CreateJournalEntry>('VoucherManager/cv', formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Voucher Posted Successfully', false);
        //Reset the form
        this.cvForm().reset({ ...this.cvModel, lines: [{ ...this.jvLines, isMainLine: true }, { ...this.jvLines, isMainLine: true }] });
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

}
