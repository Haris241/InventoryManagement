import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockMovementSummaryData, StockMovementSummarySearch } from '../../../../Models/Inventory/MovementReports.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
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
  selector: 'app-stock-movement-summary',
  imports: [
    RouterLink,
    TableModule,
    AutoCompleteModule,
    FormsModule,
    FloatLabel,
    CommonModule,
    DatePickerModule
  ],
  templateUrl: './stock-movement-summary.component.html',
  styleUrl: './stock-movement-summary.component.css',
})
export class StockMovementSummaryComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Warehouse Search
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;

  // Category Search
  productCategorySearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/ProductCategories');
  productCategoryList = this.productCategorySearch.result;

  // Product Search
  productSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Products');
  productSearchList = this.productSearch.result;

  // Product Variant Search
  productVariantSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productVariantSearchList = this.productVariantSearch.result;
  selectedProductVariant = signal<ProductVariantSearchDto | null>(null);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  movementSummaryData = signal<StockMovementSummaryData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockMovementSummarySearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    warehouseId: null,
    productCategoryId: null,
    productId: null,
    productVariantId: null,
    nextCursor: null,
    previousCursor: null,
  };

  movementSummaryModel = signal<StockMovementSummarySearch>({ ...this.initialModel });

  movementSummaryForm = form(this.movementSummaryModel);

  updateField<K extends keyof StockMovementSummarySearch>(field: K, value: StockMovementSummarySearch[K]) {
    this.movementSummaryModel.update(prev => ({
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

  loadSummary(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.movementSummaryForm().invalid()) {
      this.movementSummaryForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.movementSummaryForm().value() } as StockMovementSummarySearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'InventoryReports/StockMovementSummaryList';
    const request$ = this.dataService.getAllPost<StockMovementSummaryData, StockMovementSummarySearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.movementSummaryData.set(result);
        this.hasNextPage.set(result.items.hasNextPage);
        this.hasPreviousPage.set(result.items.hasPreviousPage);
        this.nextCursor.set(result.items.nextCursor ?? null);
        this.previousCursor.set(result.items.previousCursor ?? null);
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
    this.loadSummary(event, 'fresh');
  }

  generateReport() {
    if (this.movementSummaryForm().invalid()) {
      this.movementSummaryForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.movementSummaryForm().value() } as StockMovementSummarySearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<StockMovementSummarySearch, BackgroundJobResponse>('InventoryReports/StockMovementSummaryReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockMovementSummary.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Movement Summary Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `InventoryReports/DownloadReport/${res.job.jobId}/StockMovementSummary`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockMovementSummary.pdf');
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
