import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockValuationData, StockValuationSearch } from '../../../../Models/Inventory/StockReports.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stock-valuation',
  imports: [
    RouterLink,
    TableModule,
    AutoCompleteModule,
    FormsModule,
    FloatLabel,
    SelectModule,
    CommonModule,
    DatePickerModule
  ],
  templateUrl: './stock-valuation.component.html',
  styleUrl: './stock-valuation.component.css',
})
export class StockValuationComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  productSearchService = inject(ProductSearchService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Product Search
  productSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Products');
  productSearchList = this.productSearch.result;

  // Product Variant Search
  productVariantSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productVariantSearchList = this.productVariantSearch.result;
  selectedProductVariant = signal<ProductVariantSearchDto | null>(null);

  // Category & Brand
  productCategorySearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/ProductCategories');
  productCategoryList = this.productCategorySearch.result;

  brandSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/BrandsList');
  brandList = this.brandSearch.result;

  // Warehouse & Location
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;
  warehouseLocations = signal<AutoDropdown[]>([]);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  stockValuationData = signal<StockValuationData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockValuationSearch = {
    productId: null,
    productVariantId: null,
    warehouseId: null,
    warehouseLocationId: null,
    productCategoryId: null,
    brandId: null,
    asOfDate: null,
    asOfDateUI: null,
    includeZeroStock: false,
    nextCursor: null,
    previousCursor: null,
  };

  stockValuationModel = signal<StockValuationSearch>({ ...this.initialModel });

  stockValuationForm = form(this.stockValuationModel);

  updateField<K extends keyof StockValuationSearch>(field: K, value: StockValuationSearch[K]) {
    this.stockValuationModel.update(prev => ({
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

  onWarehouseChange(warehouseId: number | null) {
    this.updateField('warehouseId', warehouseId);
    this.updateField('warehouseLocationId', null);
    if (warehouseId) {
      this.productSearchService.getLocationsByWarehouse(warehouseId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (locations) => this.warehouseLocations.set(locations),
          error: () => this.warehouseLocations.set([])
        });
    } else {
      this.warehouseLocations.set([]);
    }
  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  loadStockValuation(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.stockValuationForm().invalid()) {
      this.stockValuationForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.stockValuationForm().value() } as StockValuationSearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.asOfDate = toDateOnlyString(formvalue.asOfDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'StockReports/StockValuationList';
    const request$ = this.dataService.getAllPost<StockValuationData, StockValuationSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.stockValuationData.set(result);
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
    this.loadStockValuation(event, 'fresh');
  }

  generateReport() {
    if (this.stockValuationForm().invalid()) {
      this.stockValuationForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.stockValuationForm().value() } as StockValuationSearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }
    formvalue.asOfDate = toDateOnlyString(formvalue.asOfDateUI);

    this.dataService.getReportOrJob<StockValuationSearch, BackgroundJobResponse>('StockReports/StockValuationReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockValuation.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Valuation Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `StockReports/DownloadReport/${res.job.jobId}/StockValuation`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockValuation.pdf');
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
