import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { AccountStatemnetSearch, TrialBalanceData, TrialBalanceSearch } from '../../../../Models/Accouting/AccountReports.model';
import { form, FormField, required } from '@angular/forms/signals';
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
import { COADropdownDto, COAList } from '../../../../Models/Accouting/ChartOfAccount.model';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
@Component({
  selector: 'app-trial-balance',
  imports: [TableModule, AutoCompleteModule, FormsModule, FormField, FloatLabelModule, SelectModule, CommonModule, DatePickerModule],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css',
})
export class TrialBalanceComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  coaList = signal<COAList[]>([]);
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/VoucherAccounts');
  coaSearchList = this.coaSearch.result;
  accountGroup = signal<COADropdownDto[]>([]);
  errors = signal<string[]>([]);

  //Load Groups
  ngOnInit() {
    this.dataService.getAllSimple<COADropdownDto>('AccountsDropDown/COAList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const formatted = res.map(acc => ({ ...acc, displayName: `${' - '.repeat(acc.level)}${acc.name}` }));
        this.accountGroup.set(formatted);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  trialBalanceData = signal<TrialBalanceData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);
  isBalanced = computed(() => {
    const d = this.trialBalanceData();
    if (!d) return true;
    return Math.abs(d.totalDebit - d.totalCredit) < 0.01;
  });

  //Model For FormData
  private readonly initialModel: TrialBalanceSearch = {
    accountId: null,
    accountGroupId: null,
    includeZeroBalance: false,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  trialBalanceModel = signal<TrialBalanceSearch>({ ...this.initialModel });

  // Signal form with validation schema
  trialBalanceForm = form(this.trialBalanceModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof TrialBalanceSearch>(field: K, value: TrialBalanceSearch[K]) {
    this.trialBalanceModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadTrialBalance(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    this.submit.set(true);
    this.formSubmitted.set(true);


    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.trialBalanceForm().value() as TrialBalanceSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    //Check if Both Accout Group or Account is Selected
    if (formvalue.accountGroupId && formvalue.accountId) {
      this.errors.set(['Please Select Either Account Group or Account']);
      this.submit.set(false);
      return;
    }

    //for update and create
    const url = `AccountsReports/TrialBalanceList`;
    // 1. Make a standard API call directly expecting the full object
    const request$ = this.dataService.getAllPost<TrialBalanceData, TrialBalanceSearch>(url, formvalue);

    // 2. Subscribe and map both the top-level data AND the nested pagination data
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {

        this.trialBalanceData.set(result);

        // Extract the pagination state directly from result.transactions
        this.hasNextPage.set(result.accounts.hasNextPage);
        this.hasPreviousPage.set(result.accounts.hasPreviousPage);
        this.nextCursor.set(result.accounts.nextCursor ?? null);
        this.previousCursor.set(result.accounts.previousCursor ?? null);

        this.submit.set(false);
        this.formSubmitted.set(false);
        this.errors.set([]);
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
    this.loadTrialBalance(event, 'fresh');
  }
  TrialBalanceReport() {

    const formvalue = this.trialBalanceForm().value() as TrialBalanceSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    //Check if Both Accout Group or Account is Selected
    if (formvalue.accountGroupId && formvalue.accountId) {
      this.errors.set(['Please Select Either Account Group or Account']);
      this.submit.set(false);
      return;
    }


    this.dataService.getReportOrJob<TrialBalanceSearch, BackgroundJobResponse>('AccountsReports/TrialBalanceReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);
          this.errors.set([]);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'TrialBalance.pdf');
            return;
          }


          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set("Trial Balance Report generation started. It will open automatically when ready.");

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `AccountsReports/DownloadReport/${res.job.jobId}/TrialBalance`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, `TrialBalance.pdf`);

                },
                error: (err) => {
                  this.base.handleError(err, err.error?.message);
                }
              });

            } else {
              this.base.handleError(null, envelope.message);
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
