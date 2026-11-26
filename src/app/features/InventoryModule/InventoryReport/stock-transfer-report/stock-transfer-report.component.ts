import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockTransferMode, StockTransferReportData, StockTransferReportSearch, StockTransferStatus } from '../../../../Models/Inventory/MovementReports.model';
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
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stock-transfer-report',
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
  templateUrl: './stock-transfer-report.component.html',
  styleUrl: './stock-transfer-report.component.css',
})
export class StockTransferReportComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Warehouse Search
  fromWareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  fromWareHouseSearchList = this.fromWareHouseSearch.result;

  toWareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  toWareHouseSearchList = this.toWareHouseSearch.result;

  // Product Search
  productSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Products');
  productSearchList = this.productSearch.result;

  // Product Variant Search
  productVariantSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productVariantSearchList = this.productVariantSearch.result;
  selectedProductVariant = signal<ProductVariantSearchDto | null>(null);

  statusOptions = [
    { name: 'Draft', value: StockTransferStatus.Draft },
    { name: 'Approved', value: StockTransferStatus.Approved },
    { name: 'Partially Received', value: StockTransferStatus.PartiallyReceived },
    { name: 'Received', value: StockTransferStatus.Received },
    { name: 'Cancelled', value: StockTransferStatus.Cancelled }
  ];

  modeOptions = [
    { name: 'Direct', value: StockTransferMode.Direct },
    { name: 'Two-Step', value: StockTransferMode.TwoStep }
  ];

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  transferData = signal<StockTransferReportData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockTransferReportSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    fromWarehouseId: null,
    toWarehouseId: null,
    status: null,
    mode: null,
    productId: null,
    productVariantId: null,
    nextCursor: null,
    previousCursor: null,
  };

  transferModel = signal<StockTransferReportSearch>({ ...this.initialModel });

  transferForm = form(this.transferModel);

  updateField<K extends keyof StockTransferReportSearch>(field: K, value: StockTransferReportSearch[K]) {
    this.transferModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  onProductChange(productId: string | null) {
    this.updateField('productId', productId);
    if (productId) {
      this.updateField('productVariantId', null);
      this.selectedProductVariant.set(null);
    }
  }

  onVariantChange(variant: ProductVariantSearchDto | null) {
    this.selectedProductVariant.set(variant);
    this.updateField('productVariantId', variant?.id ?? null);
    if (variant) {
      this.updateField('productId', null);
    }
  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  loadTransfers(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.transferForm().invalid()) {
      this.transferForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.transferForm().value() } as StockTransferReportSearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'InventoryReports/StockTransferReportList';
    const request$ = this.dataService.getAllPost<StockTransferReportData, StockTransferReportSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.transferData.set(result);
        this.hasNextPage.set(result.transfers.hasNextPage);
        this.hasPreviousPage.set(result.transfers.hasPreviousPage);
        this.nextCursor.set(result.transfers.nextCursor ?? null);
        this.previousCursor.set(result.transfers.previousCursor ?? null);
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
    this.loadTransfers(event, 'fresh');
  }

  generateReport() {
    if (this.transferForm().invalid()) {
      this.transferForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.transferForm().value() } as StockTransferReportSearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<StockTransferReportSearch, BackgroundJobResponse>('InventoryReports/StockTransferReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockTransferReport.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Transfer Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `InventoryReports/DownloadReport/${res.job.jobId}/StockTransferReport`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockTransferReport.pdf');
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
