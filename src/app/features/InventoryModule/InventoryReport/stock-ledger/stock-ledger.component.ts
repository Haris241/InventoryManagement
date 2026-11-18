import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { StockLedgerData, StockLedgerSearch } from '../../../../Models/Inventory/StockReports.model';
import { form, required } from '@angular/forms/signals';
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
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { BackgroundJobResponse } from '../../../../Models/Accouting/FiscalYear.model';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../Models/Notification.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stock-ledger',
  imports: [
    RouterLink,
    TableModule,
    AutoCompleteModule,
    FormsModule,
    FloatLabel,
    SelectModule,
    CommonModule,
    DatePickerModule,
    FieldErrorSComponent
  ],
  templateUrl: './stock-ledger.component.html',
  styleUrl: './stock-ledger.component.css',
})
export class StockLedgerComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  productSearchService = inject(ProductSearchService);
  destroyRef = inject(DestroyRef);
  notifState = inject(NotificationService);

  // Variant search
  productVariantSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productVariantSearchList = this.productVariantSearch.result;
  selectedProductVariant = signal<ProductVariantSearchDto | null>(null);

  // Warehouse & Location
  wareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  wareHouseSearchList = this.wareHouseSearch.result;
  warehouseLocations = signal<AutoDropdown[]>([]);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  stockLedgerData = signal<StockLedgerData | null>(null);
  closingMessage = signal<string>('');
  backgroundJobId = signal<string | null>(null);

  // Pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  // Search Model
  private readonly initialModel: StockLedgerSearch = {
    productVariantId: null,
    warehouseId: null,
    warehouseLocationId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    nextCursor: null,
    previousCursor: null,
  };

  stockLedgerModel = signal<StockLedgerSearch>({ ...this.initialModel });

  stockLedgerForm = form(this.stockLedgerModel, (schema) => {
    required(schema.productVariantId, { message: 'Product Variant is required' });
  });

  updateField<K extends keyof StockLedgerSearch>(field: K, value: StockLedgerSearch[K]) {
    this.stockLedgerModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  onVariantChange(variant: ProductVariantSearchDto | null) {
    this.selectedProductVariant.set(variant);
    this.updateField('productVariantId', variant?.id ?? null);
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

  loadStockLedger(event: Event, direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.stockLedgerForm().invalid()) {
      this.stockLedgerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formvalue = { ...this.stockLedgerForm().value() } as StockLedgerSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);
    formvalue.nextCursor = direction === 'next' ? this.nextCursor() : null;
    formvalue.previousCursor = direction === 'previous' ? this.previousCursor() : null;

    const url = 'StockReports/StockLedgerList';
    const request$ = this.dataService.getAllPost<StockLedgerData, StockLedgerSearch>(url, formvalue);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.stockLedgerData.set(result);
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
    this.loadStockLedger(event, 'fresh');
  }

  generateReport() {
    if (this.stockLedgerForm().invalid()) {
      this.stockLedgerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = { ...this.stockLedgerForm().value() } as StockLedgerSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    this.dataService.getReportOrJob<StockLedgerSearch, BackgroundJobResponse>('StockReports/StockLedgerReport', formvalue)
      .subscribe({
        next: (res) => {
          this.submit.set(false);
          this.formSubmitted.set(false);

          if (res.type === 'file') {
            const newTab = openLoadingTab();
            showBlobInTab(newTab, res.blob, 'StockLedger.pdf');
            return;
          }

          this.backgroundJobId.set(res.job.jobId);
          this.closingMessage.set('Stock Ledger Report generation started. It will open automatically when ready.');

          const sub = this.notifState.onJobComplete(res.job.jobId, (envelope) => {
            if (envelope.type === NotificationType.Success) {
              const url = `StockReports/DownloadReport/${res.job.jobId}/StockLedger`;
              this.dataService.downloadReport(url).subscribe({
                next: (blob) => {
                  const newTab = openLoadingTab();
                  showBlobInTab(newTab, blob, 'StockLedger.pdf');
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
