import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, readonly, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { enumToOptions } from '../../../../shared/Utility';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';
import { StockTransferService } from '../../../../services/Inventory/StockTransfer.service';
import { StockTransferDto, StockTransferLineDto, StockTransferMode } from '../../../../Models/Inventory/StockTransfer.model';
import { DataLayerService } from '../../../../services/data-layer.service';

@Component({
  selector: 'app-stockt-transfer-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './stockt-transfer-add-update.component.html',
  styleUrl: './stockt-transfer-add-update.component.css',
})
export class StocktTransferAddUpdateComponent {
  warehouses = signal<AutoDropdown[]>([]);
  warehouseLocations = signal<Record<number, AutoDropdown[]>>({});
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);

  private stService = inject(StockTransferService);
  private productSearchService = inject(ProductSearchService);
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private pagination = inject(PaginationService);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  isEditMode = signal<boolean>(false);
  isRecievedMode = signal<boolean>(false);

  modes = signal(enumToOptions(StockTransferMode, true));
  stModel = signal<StockTransferDto>(this.stService.createDefaultST());

  // Global Product Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;

  ngOnInit() {
    this.loadFormLookups();

    const currentUrl = this.router.url.toLowerCase();
    if (currentUrl.includes('recievestocktransfer') || currentUrl.includes('receivestocktransfer')) {
      this.isRecievedMode.set(true);
    }

    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(param => {
      const id = param.get('id');
      if (id) {
        if (!this.isRecievedMode()) {
          this.isEditMode.set(true);
        }
        this.loadStockTransfer(id, this.isRecievedMode());
      }
    });
  }

  stForm = form(this.stModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.fromWarehouseId, { message: 'From Warehouse is required' });
    required(schema.toWarehouseId, { message: 'To Warehouse is required' });
    required(schema.transferDateUI, { message: 'Transfer Date is required' });
    required(schema.mode, { message: 'Mode is required' });

    validate(schema.toWarehouseId, ({ value, valueOf }) => {
      const toWh = value();
      const fromWh = valueOf(schema.fromWarehouseId);
      if (toWh != null && fromWh != null && toWh === fromWh) {
        return { kind: 'sameWarehouse', message: 'From Warehouse and To Warehouse cannot be the same' };
      }
      return null;
    });

    // Make readonly in received mode
    readonly(schema.name, () => this.isRecievedMode());
    readonly(schema.remarks, () => this.isRecievedMode());

    applyEach(schema.lines, (line) => {
      required(line.productVariantId, { message: 'Product is required' });

      validate(line.quantity, ({ value }) => {
        const qty = value();
        if (qty == null || qty <= 0) {
          return { kind: 'positiveQuantity', message: 'Quantity must be greater than 0' };
        }
        return null;
      });

      validate(line.receivedQuantity, ({ value, valueOf }) => {
        if (!this.isRecievedMode()) {
          return null;
        }
        const recQty = value();
        const qty = valueOf(line.quantity) ?? 0;
        if (recQty == null || recQty < 0) {
          return { kind: 'positiveReceivedQuantity', message: 'Received quantity must be greater than or equal to 0' };
        }
        if (recQty > qty) {
          return { kind: 'receivedExceeded', message: `Received quantity cannot exceed transfer quantity (${qty})` };
        }
        return null;
      });

      // Lines readonly in received mode
      readonly(line.quantity, () => this.isRecievedMode());
      readonly(line.barcode, () => this.isRecievedMode());
      readonly(line.remarks, () => this.isRecievedMode());
    });
  });

  updateField<K extends keyof StockTransferDto>(field: K, value: StockTransferDto[K]) {
    this.stModel.update(prev => this.stService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof StockTransferLineDto>(
    index: number,
    field: K,
    value: StockTransferLineDto[K]
  ) {
    this.stModel.update(prev => this.stService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    if (this.isRecievedMode()) return;

    const index = this.stModel().lines.length - 1;
    const line = this.stForm.lines[index];

    const isInvalid = line.productVariantId().invalid() || line.quantity().invalid();
    if (isInvalid) {
      line.productVariantId().markAsTouched();
      line.quantity().markAsTouched();
      return;
    }

    this.stModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.stService.createDefaultSTline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    if (this.isRecievedMode()) return;
    this.stModel.update(prev => this.stService.deleteLine(prev, lineIndex));
  }

  onFromWarehouseChange(warehouseId: number | null): void {
    this.updateField('fromWarehouseId', warehouseId);

    if (warehouseId != null && !this.warehouseLocations()[warehouseId]) {
      this.loadWarehouseLocations(warehouseId);
    }

    // Reset fromWarehouseLocationId for all lines
    this.stModel.update(prev => {
      const lines = prev.lines.map(line => ({
        ...line,
        fromWarehouseLocationId: null
      }));
      return { ...prev, lines };
    });

    this.refreshAvailableStockForAllLines();
  }

  onToWarehouseChange(warehouseId: number | null): void {
    this.updateField('toWarehouseId', warehouseId);

    if (warehouseId != null && !this.warehouseLocations()[warehouseId]) {
      this.loadWarehouseLocations(warehouseId);
    }

    // Reset toWarehouseLocationId for all lines
    this.stModel.update(prev => {
      const lines = prev.lines.map(line => ({
        ...line,
        toWarehouseLocationId: null
      }));
      return { ...prev, lines };
    });
  }

  onFromLocationChange(index: number, locationId: number | null): void {
    this.updateLineField(index, 'fromWarehouseLocationId', locationId);
    const line = this.stModel().lines[index];
    const fromWhId = this.stModel().fromWarehouseId;
    if (line.productVariantId && fromWhId) {
      this.fetchAvailableStock(index, fromWhId, line.productVariantId, locationId);
    }
  }

  onToLocationChange(index: number, locationId: number | null): void {
    this.updateLineField(index, 'toWarehouseLocationId', locationId);
  }

  loadWarehouseLocations(warehouseId: number): void {
    this.productSearchService.getLocationsByWarehouse(warehouseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locations) => {
          this.warehouseLocations.update(current => ({ ...current, [warehouseId]: locations }));
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  getWarehouseLocations(warehouseId: number | null): AutoDropdown[] {
    if (warehouseId == null) {
      return [];
    }
    return this.warehouseLocations()[warehouseId] ?? [];
  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  onProductVariantChange(index: number, product: ProductVariantSearchDto | null) {
    if (!product) {
      this.updateLineField(index, 'productVariantId', null);
      this.updateLineField(index, 'productName', '');
      this.updateLineField(index, 'barcode', '');
      this.updateLineField(index, 'uom', '');
      this.updateLineField(index, 'availableQuantity', 0);
      this.updateLineField(index, 'selectedProductVariant', undefined);
      return;
    }

    this.setProductVariant(index, product);
  }

  setProductVariant(index: number, product: ProductVariantSearchDto) {
    this.stModel.update(prev => {
      const lines = [...prev.lines];
      lines[index] = {
        ...lines[index],
        selectedProductVariant: product,
        productVariantId: product.id,
        productName: product.displayName,
        barcode: product.barcode ?? '',
        uom: product.uom ?? ''
      };
      return { ...prev, lines };
    });

    const fromWhId = this.stModel().fromWarehouseId;
    const fromLocId = this.stModel().lines[index].fromWarehouseLocationId;
    if (fromWhId && product.id) {
      this.fetchAvailableStock(index, fromWhId, product.id, fromLocId);
    }
  }

  searchBarcode(index: number, event: Event) {
    if (!this.enableBarcode() || this.isRecievedMode()) {
      return;
    }
    event.preventDefault();

    const barcode = this.stModel().lines[index].barcode?.trim();
    if (!barcode) return;

    this.productSearchService.getProductVariantByBarcode(barcode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.setProductVariant(index, product);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  fetchAvailableStock(index: number, warehouseId: number, productVariantId: string, locationId?: number | null): void {
    this.productSearchService.getProductVariantAvailableStock(warehouseId, productVariantId, locationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.updateLineField(index, 'availableQuantity', res.availableQuantity ?? 0);
        },
        error: () => {
          this.updateLineField(index, 'availableQuantity', 0);
        }
      });
  }

  refreshAvailableStockForAllLines(): void {
    const fromWhId = this.stModel().fromWarehouseId;
    if (!fromWhId) {
      this.stModel.update(prev => ({
        ...prev,
        lines: prev.lines.map(l => ({ ...l, availableQuantity: 0 }))
      }));
      return;
    }

    this.stModel().lines.forEach((line, i) => {
      if (line.productVariantId) {
        this.fetchAvailableStock(i, fromWhId, line.productVariantId, line.fromWarehouseLocationId);
      }
    });
  }

  loadFormLookups(): void {
    this.stService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.warehouses.set(res.warehouses ?? []);
          this.enableBarcode.set(res.enableBarcode ?? false);
          this.enableLocation.set(res.enableLocations ?? false);
        },
        error: () => {
          // Fallback to general WareHouseDropDown if specific lookup endpoint is absent
          this.dataService.getAllSimple<AutoDropdown>('Dropdowns/WareHouseDropDown')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (warehouses) => {
                this.warehouses.set(warehouses ?? []);
                this.enableBarcode.set(true);
                this.enableLocation.set(true);
              }
            });
        }
      });
  }

  loadStockTransfer(id: string, isReceived: boolean) {
    this.stService.getSTById(id, isReceived)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          data.lines.forEach(line => {
            line.selectedProductVariant = {
              id: line.productVariantId!,
              displayName: line.productName,
              barcode: line.barcode,
              uom: line.uom,
              sku: "",
              cost: 0
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!)
          );

          data.transferDateUI = data.transferDate ? new Date(data.transferDate) : null;
          this.stModel.set(data);

          if (data.fromWarehouseId) {
            this.loadWarehouseLocations(data.fromWarehouseId);
          }
          if (data.toWarehouseId) {
            this.loadWarehouseLocations(data.toWarehouseId);
          }

          // If available quantity is not returned by GET, query available stock
          if (data.fromWarehouseId) {
            data.lines.forEach((line, idx) => {
              if (line.productVariantId && (line.availableQuantity == null || line.availableQuantity === 0)) {
                this.fetchAvailableStock(idx, data.fromWarehouseId!, line.productVariantId, line.fromWarehouseLocationId);
              }
            });
          }
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'stocktransferlist']);
        }
      });
  }

  submitST(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.stForm().invalid()) {
      this.stForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.stForm().value() as StockTransferDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    if (this.isRecievedMode()) {
      this.stService.receiveST(formvalue)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.router.navigate(['Inventory', 'stocktransferlist']);
            this.base.globalMessage('success', 'Stock Transfer Received Successfully', false);
          },
          error: (err) => {
            if (err.error?.errors) {
              this.backendErrors.set(err.error.errors);
            } else {
              this.base.handleError(err, err.error?.message);
            }
            this.submit.set(false);
          }
        });
      return;
    }

    this.stService.saveST(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'stocktransferlist']);
            this.base.globalMessage('success', 'Stock Transfer Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Stock Transfer Added Successfully', false);
          this.stModel.set(this.stService.createDefaultST());
          this.submit.set(false);
          this.formSubmitted.set(false);
        },
        error: (err) => {
          if (err.error?.errors) {
            this.backendErrors.set(err.error.errors);
          } else {
            this.base.handleError(err, err.error?.message);
          }
          this.submit.set(false);
        }
      });
  }
}
