import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockReconciliationData, StockReconciliationMode, StockReconciliationSearch } from '../../../../Models/Inventory/ControlReports.model';
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
  selector: 'app-stock-reconciliation',
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
  templateUrl: './stock-reconciliation.component.html',
  styleUrl: './stock-reconciliation.component.css',
})
export class StockReconciliationComponent {
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

  modeOptions = [
    { name: 'Physical Count', value: StockReconciliationMode.PhysicalCount },
    { name: 'Ledger vs Snapshot', value: StockReconciliationMode.LedgerVsSnapshot }
  ];

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  reconciliationData = signal<StockReconciliationData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockReconciliationSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    warehouseId: null,
    productId: null,
    productVariantId: null,
    varianceOnly: false,
    mode: null,
    nextCursor: null,
    previousCursor: null,
  };

  reconciliationModel = signal<StockReconciliationSearch>({ ...this.initialModel });

  reconciliationForm = form(this.reconciliationModel);

  updateField<K extends keyof StockReconciliationSearch>(field: K, value: StockReconciliationSearch[K]) {
    this.reconciliationModel.update(prev => ({
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

  loadReconciliation(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.reconciliationForm().invalid()) {
      this.reconciliationForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.reconciliationForm().value() } as StockReconciliationSearch;

    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }

    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'InventoryReports/StockReconciliationList';
    const request$ = this.dataService.getAllPost<StockReconciliationData, StockReconciliationSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.reconciliationData.set(result);
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
    this.loadReconciliation(event, 'fresh');
  }

  generateReport() {
    if (this.reconciliationForm().invalid()) {
      this.reconciliationForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.reconciliationForm().value() } as StockReconciliationSearch;
    if (formvalue.productId) {
      formvalue.productVariantId = null;
    } else if (formvalue.productVariantId) {
      formvalue.productId = null;
    }
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<StockReconciliationSearch, BackgroundJobResponse>('InventoryReports/StockReconciliationReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockReconciliation.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Reconciliation Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `InventoryReports/DownloadReport/${res.job.jobId}/StockReconciliation`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockReconciliation.pdf');
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
