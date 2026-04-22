import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { DataLayerService } from '../../../../../services/data-layer.service';
import { BaseApiService } from '../../../../../services/base-api.service';
import { CreateJournalEntry, CreateJournalEntryLine, JournalCategory, SourceType, VoucherType } from '../../../../../Models/Accouting/VoucherManager.model';
import { applyEach, form, FormField, min, required } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FieldErrorSComponent } from "../../../../../shared/field-error-s/field-error-s.component";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { enumToOptions } from '../../../../../shared/Utility';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginationService } from '../../../../../services/pagination.service';
import { AutoDropdown } from '../../../../../Models/Pagination.model';
import { CurrencyDto } from '../../../../../Models/Auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { voucherMangerService } from '../../../../../services/Accounting/voucherManger.service';

@Component({
  selector: 'app-jv-voucher',
  imports: [FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './jv-voucher.component.html',
  styleUrl: './jv-voucher.component.css',
})
export class JvVoucherComponent {

  //Initial Call
  currencies = signal<CurrencyDto[]>([]);
  ngOnInit(): void {
    this.loadCurrencies();
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
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/VoucherAccounts');
  coaSearchList = this.coaSearch.result;

  //Initialize Lines
  private readonly jvLines: CreateJournalEntryLine = {
    chartOfAccountId: null,
    description: '',
    debit: 0,
    credit: 0,
    currencyCode: '',
    exchangeRate: 1,
    relatedEntityId: '',
    referenceNo: ''
  };

  //Intialize Main Object
  private readonly jvModel: CreateJournalEntry = {
    voucherType: VoucherType.Journal,
    postingDate: new Date(),
    narration: '',
    category: JournalCategory.Normal,
    sourceType: SourceType.Manual,
    sourceId: '',
    lines: [{ ...this.jvLines }]
  };

  //Intialize Main Object with Signal
  journalModel = signal<CreateJournalEntry>(this.jvModel);

  //validations
  journalForm = form(this.journalModel, (schema) => {
    // Root validations
    required(schema.voucherType, { message: 'Voucher Type is required' });
    required(schema.postingDate, { message: 'Posting Date is required' });
    required(schema.category, { message: 'Category is required' });

    // Nested lines validation
    applyEach(schema.lines, (line) => {
      required(line.chartOfAccountId, { message: 'Account is required' });
      required(line.description, { message: 'Description is required' });
      min(line.debit, 0, { message: 'Debit must be >= 0' });
      min(line.credit, 0, { message: 'Credit must be >= 0' });
    });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CreateJournalEntry>(field: K, value: CreateJournalEntry[K]) {
    this.journalModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof CreateJournalEntryLine>(
    index: number,
    field: K,
    value: CreateJournalEntryLine[K]
  ) {
    this.journalModel.update(prev => {
      const lines = [...prev.lines];           // shallow copy the array
      lines[index] = { ...lines[index], [field]: value }; // copy the line, update field
      return { ...prev, lines };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {

    this.journalModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, { ...this.jvLines }]
    }));
    console.log("Full Data:", JSON.stringify(this.journalModel(), null, 2));
  }

  // ✅ Delete a line by index
  deleteLine(index: number): void {
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
  }

  //Global Search
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }


}
