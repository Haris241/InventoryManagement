import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { AccountStatemnetSearch, DayBookData, DayBookLineData, DayBookSearch, FullAccountLineData, FullAccountStatementData, GeneralLederSearch, GeneralLedgerData } from '../../../../Models/Accouting/AccountReports.model';
import { form, required } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { enumToOptions, openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { VoucherType } from '../../../../Models/Accouting/VoucherManager.model';

@Component({
  selector: 'app-day-book',
  imports: [RouterLink, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, DatePickerModule],
  templateUrl: './day-book.component.html',
  styleUrl: './day-book.component.css',
})
export class DayBookComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  voucheTypes = signal(enumToOptions(VoucherType, true));

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  dayBookData = signal<DayBookData | null>(null);

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);


  //Model For FormData
  private readonly initialModel: DayBookSearch = {
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    voucherType: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  dayBookModel = signal<DayBookSearch>({ ...this.initialModel });

  // Signal form with validation schema
  dayBookForm = form(this.dayBookModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof DayBookSearch>(field: K, value: DayBookSearch[K]) {
    this.dayBookModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadDayBook(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.dayBookForm().invalid()) {
      this.dayBookForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.dayBookForm().value() as DayBookSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    //for update and create
    const url = `AccountsReports/DayBookList`;
    // 1. Make a standard API call directly expecting the full object
    const request$ = this.dataService.getAllPost<DayBookData, DayBookSearch>(url, formvalue);

    // 2. Subscribe and map both the top-level data AND the nested pagination data
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {

        this.dayBookData.set(result);

        // Extract the pagination state directly from result.transactions
        this.hasNextPage.set(result.transactions.hasNextPage);
        this.hasPreviousPage.set(result.transactions.hasPreviousPage);
        this.nextCursor.set(result.transactions.nextCursor ?? null);
        this.previousCursor.set(result.transactions.previousCursor ?? null);

        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.submit.set(false);
        if (err.error?.errors) {
          this.backendErrors.set(err.error.errors);
        } else {
          this.base.handleError(err, err.error?.message, false);
        }
      }
    });
  }

  //On Search
  OnSearch(event: Event) {
    this.loadDayBook(event, 'fresh');
  }

  DayBookReport() {
    if (this.dayBookForm().invalid()) {
      this.dayBookForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.dayBookForm().value() as DayBookSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/DayBookReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `DayBookReport.pdf`);
          this.submit.set(false);
          this.formSubmitted.set(false);

        },
        error: (err) => {
          this.submit.set(false);
          if (newTab) newTab.close();
          this.base.handleError(err, err.error?.message);
        }
      });

  }

}
