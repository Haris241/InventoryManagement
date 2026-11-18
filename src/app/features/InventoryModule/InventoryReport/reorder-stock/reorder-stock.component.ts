import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { ReorderStockData, ReorderStockSearch, ReorderStockStatus } from '../../../../Models/Inventory/StockReports.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { openLoadingTab, showBlobInTab } from '../../../../shared/Utility';
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
  selector: 'app-reorder-stock',
  imports: [
    RouterLink,
    TableModule,
    AutoCompleteModule,
    FormsModule,
    FloatLabel,
    SelectModule,
    InputTextModule,
    CommonModule
  ],
  templateUrl: './reorder-stock.component.html',
  styleUrl: './reorder-stock.component.css',
})
export class ReorderStockComponent {
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

  // Category
  productCategorySearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/ProductCategories');
  productCategoryList = this.productCategorySearch.result;

  // Warehouse & Location
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;
  warehouseLocations = signal<AutoDropdown[]>([]);

  statusFilterOptions = [
    { name: 'All', value: ReorderStockStatus.All },
    { name: 'Out Of Stock', value: ReorderStockStatus.OutOfStock },
    { name: 'Low Stock', value: ReorderStockStatus.LowStock }
  ];

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  reorderStockData = signal<ReorderStockData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: ReorderStockSearch = {
    productId: null,
    productVariantId: null,
    warehouseId: null,
    warehouseLocationId: null,
    productCategoryId: null,
    thresholdQuantity: null,
    statusFilter: ReorderStockStatus.All,
    nextCursor: null,
    previousCursor: null,
  };

  reorderStockModel = signal<ReorderStockSearch>({ ...this.initialModel });

  reorderStockForm = form(this.reorderStockModel);

  updateField<K extends keyof ReorderStockSearch>(field: K, value: ReorderStockSearch[K]) {
    this.reorderStockModel.update(prev => ({
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

  loadReorderStock(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.reorderStockForm().invalid()) {
      this.reorderStockForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.reorderStockForm().value() } as ReorderStockSearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'StockReports/ReorderStockList';
    const request$ = this.dataService.getAllPost<ReorderStockData, ReorderStockSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.reorderStockData.set(result);
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
    this.loadReorderStock(event, 'fresh');
  }

  generateReport() {
    if (this.reorderStockForm().invalid()) {
      this.reorderStockForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.reorderStockForm().value() } as ReorderStockSearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    this.dataService.getReportOrJob<ReorderStockSearch, BackgroundJobResponse>('StockReports/ReorderStockReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'ReorderStock.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Reorder / Low Stock Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `StockReports/DownloadReport/${res.job.jobId}/ReorderStock`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'ReorderStock.pdf');
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
