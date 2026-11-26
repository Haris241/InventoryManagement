import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { PendingTransactionItemData, PendingTransactionsData, PendingTransactionsSearch, PendingTransactionStage, PendingTransactionType } from '../../../../Models/Inventory/ControlReports.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pending-transactions',
  imports: [
    RouterLink,
    TableModule,
    AutoCompleteModule,
    SelectModule,
    FormsModule,
    FloatLabel,
    CommonModule,
    DatePickerModule
  ],
  templateUrl: './pending-transactions.component.html',
  styleUrl: './pending-transactions.component.css',
})
export class PendingTransactionsComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Warehouse Search
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;

  transactionTypeOptions = [
    { name: 'All', value: PendingTransactionType.All },
    { name: 'Gate Entry', value: PendingTransactionType.GateEntry },
    { name: 'Stock Transfer', value: PendingTransactionType.StockTransfer },
    { name: 'Stock Adjustment', value: PendingTransactionType.StockAdjustment },
    { name: 'GRN', value: PendingTransactionType.GRN },
    { name: 'Outward Gate Pass', value: PendingTransactionType.OutwardGatePass },
    { name: 'Purchase Order', value: PendingTransactionType.PurchaseOrder }
  ];

  stageOptions = [
    { name: 'All', value: PendingTransactionStage.All },
    { name: 'Draft', value: PendingTransactionStage.Draft },
    { name: 'In-Transit', value: PendingTransactionStage.InTransit },
    { name: 'Awaiting Approval', value: PendingTransactionStage.AwaitingApproval },
    { name: 'Pending Delivery', value: PendingTransactionStage.PendingDelivery },
    { name: 'Awaiting GRN', value: PendingTransactionStage.AwaitingGrn },
    { name: 'Pending Gate Exit', value: PendingTransactionStage.PendingGateExit }
  ];

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  pendingData = signal<PendingTransactionsData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: PendingTransactionsSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    warehouseId: null,
    transactionType: PendingTransactionType.All,
    stage: PendingTransactionStage.All,
    nextCursor: null,
    previousCursor: null,
  };

  pendingModel = signal<PendingTransactionsSearch>({ ...this.initialModel });

  pendingForm = form(this.pendingModel);

  updateField<K extends keyof PendingTransactionsSearch>(field: K, value: PendingTransactionsSearch[K]) {
    this.pendingModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  loadPending(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.pendingForm().invalid()) {
      this.pendingForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.pendingForm().value() } as PendingTransactionsSearch;

    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'InventoryReports/PendingTransactionsList';
    const request$ = this.dataService.getAllPost<PendingTransactionsData, PendingTransactionsSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.pendingData.set(result);
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

  OnSearch(event: Event) {
    this.closingMessage.set('');
    this.loadPending(event, 'fresh');
  }

  generateReport() {
    if (this.pendingForm().invalid()) {
      this.pendingForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.pendingForm().value() } as PendingTransactionsSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<PendingTransactionsSearch, BackgroundJobResponse>('InventoryReports/PendingTransactionsReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'PendingTransactions.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Pending Transactions Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `InventoryReports/DownloadReport/${res.job.jobId}/PendingTransactions`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'PendingTransactions.pdf');
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
}
