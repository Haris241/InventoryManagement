import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockAdjustmentReason, StockAdjustmentReportData, StockAdjustmentReportSearch, StockAdjustmentStatus, StockAdjustmentType } from '../../../../Models/Inventory/MovementReports.model';
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
  selector: 'app-stock-adjustment-report',
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
  templateUrl: './stock-adjustment-report.component.html',
  styleUrl: './stock-adjustment-report.component.css',
})
export class StockAdjustmentReportComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Warehouse Search
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;

  // Product Search
  productSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Products');
  productSearchList = this.productSearch.result;

  // Product Variant Search
  productVariantSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productVariantSearchList = this.productVariantSearch.result;
  selectedProductVariant = signal<ProductVariantSearchDto | null>(null);

  reasonOptions = [
    { name: 'Physical Count', value: StockAdjustmentReason.PhysicalCount },
    { name: 'Damaged', value: StockAdjustmentReason.Damaged },
    { name: 'Expired', value: StockAdjustmentReason.Expired },
    { name: 'Lost / Theft', value: StockAdjustmentReason.LostOrTheft },
    { name: 'Found', value: StockAdjustmentReason.Found },
    { name: 'Opening Balance', value: StockAdjustmentReason.OpeningBalance },
    { name: 'Other', value: StockAdjustmentReason.Other }
  ];

  statusOptions = [
    { name: 'Draft', value: StockAdjustmentStatus.Draft },
    { name: 'Approved', value: StockAdjustmentStatus.Approved },
    { name: 'Cancelled', value: StockAdjustmentStatus.Cancelled }
  ];

  adjustmentTypeOptions = [
    { name: 'All', value: StockAdjustmentType.All },
    { name: 'Increase', value: StockAdjustmentType.Increase },
    { name: 'Decrease', value: StockAdjustmentType.Decrease }
  ];

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  adjustmentData = signal<StockAdjustmentReportData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockAdjustmentReportSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    warehouseId: null,
    reason: null,
    status: null,
    adjustmentType: null,
    productId: null,
    productVariantId: null,
    nextCursor: null,
    previousCursor: null,
  };

  adjustmentModel = signal<StockAdjustmentReportSearch>({ ...this.initialModel });

  adjustmentForm = form(this.adjustmentModel);

  updateField<K extends keyof StockAdjustmentReportSearch>(field: K, value: StockAdjustmentReportSearch[K]) {
    this.adjustmentModel.update(prev => ({
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

  loadAdjustments(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.adjustmentForm().invalid()) {
      this.adjustmentForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.adjustmentForm().value() } as StockAdjustmentReportSearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'InventoryReports/StockAdjustmentReportList';
    const request$ = this.dataService.getAllPost<StockAdjustmentReportData, StockAdjustmentReportSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.adjustmentData.set(result);
        this.hasNextPage.set(result.adjustments.hasNextPage);
        this.hasPreviousPage.set(result.adjustments.hasPreviousPage);
        this.nextCursor.set(result.adjustments.nextCursor ?? null);
        this.previousCursor.set(result.adjustments.previousCursor ?? null);
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
    this.loadAdjustments(event, 'fresh');
  }

  generateReport() {
    if (this.adjustmentForm().invalid()) {
      this.adjustmentForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.adjustmentForm().value() } as StockAdjustmentReportSearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<StockAdjustmentReportSearch, BackgroundJobResponse>('InventoryReports/StockAdjustmentReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockAdjustmentReport.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Adjustment Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `InventoryReports/DownloadReport/${res.job.jobId}/StockAdjustmentReport`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockAdjustmentReport.pdf');
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
