import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { AccountStatemnetSearch, FullAccountLineData, FullAccountStatementData, GeneralLederSearch, GeneralLedgerData } from '../../../../Models/Accouting/AccountReports.model';
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
import { COAList } from '../../../../Models/Accouting/ChartOfAccount.model';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldErrorSComponent } from "../../../../shared/field-error-s/field-error-s.component";
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-full-account-statement',
  imports: [RouterLink, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, DatePickerModule, FieldErrorSComponent],
  templateUrl: './full-account-statement.component.html',
  styleUrl: './full-account-statement.component.css',
})
export class FullAccountStatementComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);


  coaList = signal<COAList[]>([]);
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/VoucherAccounts');
  coaSearchList = this.coaSearch.result;

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  fullAccountStatementData = signal<FullAccountStatementData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);


  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);


  //Model For FormData
  private readonly initialModel: AccountStatemnetSearch = {
    accountId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  accountStatemnetModel = signal<AccountStatemnetSearch>({ ...this.initialModel });

  // Signal form with validation schema
  accountStatemnetForm = form(this.accountStatemnetModel, (schema) => {
    // Root validations
    required(schema.accountId, { message: 'Account is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof AccountStatemnetSearch>(field: K, value: AccountStatemnetSearch[K]) {
    this.accountStatemnetModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadAccountStatement(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.accountStatemnetForm().invalid()) {
      this.accountStatemnetForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.accountStatemnetForm().value() as AccountStatemnetSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    //for update and create
    const url = `AccountsReports/FullAccountStatementList`;
    // 1. Make a standard API call directly expecting the full object
    const request$ = this.dataService.getAllPost<FullAccountStatementData, AccountStatemnetSearch>(url, formvalue);

    // 2. Subscribe and map both the top-level data AND the nested pagination data
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {

        this.fullAccountStatementData.set(result);

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
    this.closingMessage.set('');
    this.loadAccountStatement(event, 'fresh');
  }
  AccountStatementReport() {
    if (this.accountStatemnetForm().invalid()) {
      this.accountStatemnetForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.accountStatemnetForm().value() as AccountStatemnetSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<AccountStatemnetSearch, BackgroundJobResponse>('AccountsReports/FullAccountStatementReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'FullAccountStatement.pdf');
            return;
          }


          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set("Account Statement Report generation started. It will open automatically when ready.");

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `AccountsReports/DownloadReport/${res.job.jobId}/FullAccountStatement`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, `FullAccountStatement.pdf`);

                },
                error: (err) => {
                  this.base.handleError(err, err.error?.message);
                }
              });

            }
            sub.unsubscribe();
          });

        },
        error: (err) => {
          this.submit.set(false);
          this.base.handleError(err, err.error?.message);
        }
      });

  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
}
