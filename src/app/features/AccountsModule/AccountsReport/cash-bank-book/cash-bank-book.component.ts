import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { CashBankBookData, CashBankBookSearch, GeneralLederSearch, GeneralLedgerData } from '../../../../Models/Accouting/AccountReports.model';
import { form, required } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-cash-bank-book',
  imports: [RouterLink, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, DatePickerModule],
  templateUrl: './cash-bank-book.component.html',
  styleUrl: './cash-bank-book.component.css',
})
export class CashBankBookComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  cashBankBookData = signal<CashBankBookData | null>(null);

  cashBankUsageAccounts = signal<AutoDropdown[]>([]);

  //Initial Call For Cash/Bank Accounts
  ngOnInit(): void {
    this.loadCashUsageAccounts();
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

  //Model For FormData
  private readonly initialModel: CashBankBookSearch = {
    cashBankAccountId: null,
    showBankBook: false,
    showCashBook: false,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null
  };
  //Signal Model For FormData
  cashBankBookModel = signal<CashBankBookSearch>({ ...this.initialModel });

  // Signal form with validation schema
  cashBankBookForm = form(this.cashBankBookModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CashBankBookSearch>(field: K, value: CashBankBookSearch[K]) {
    this.cashBankBookModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadCashBankBook(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.cashBankBookForm().invalid()) {
      this.cashBankBookForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.cashBankBookForm().value() as CashBankBookSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    //for update and create
    const url = `AccountsReports/CashBankBookList`;
    const request$ = this.dataService.createResponse<CashBankBookSearch, CashBankBookData>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.cashBankBookData.set(result);
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
    this.loadCashBankBook(event);
  }

  CashBankBookReport() {
    if (this.cashBankBookForm().invalid()) {
      this.cashBankBookForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.cashBankBookForm().value() as CashBankBookSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/CashBankBookReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `CashBankBookReport.pdf`);
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
