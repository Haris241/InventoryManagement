import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, required, validate } from '@angular/forms/signals';
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
import { StockAdjustmentService } from '../../../../services/Inventory/StockAdjustment.service';
import { StockAdjustmentDto, StockAdjustmentLineDto, StockAdjustmentReason } from '../../../../Models/Inventory/StockAdjustment.model';
import { DataLayerService } from '../../../../services/data-layer.service';
import { validateDecimalPlaces } from '../../../../shared/validators/decimal.validator';

@Component({
  selector: 'app-stock-adjustment-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './stock-adjustment-add-update.component.html',
  styleUrl: './stock-adjustment-add-update.component.css',
})
export class StockAdjustmentAddUpdateComponent {
  warehouses = signal<AutoDropdown[]>([]);
  warehouseLocations = signal<Record<number, AutoDropdown[]>>({});
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);

  private saService = inject(StockAdjustmentService);
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

  reasons = signal(enumToOptions(StockAdjustmentReason, true));
  saModel = signal<StockAdjustmentDto>(this.saService.createDefaultSA());

  // Global Product Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;

  ngOnInit() {
    this.loadFormLookups();

    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(param => {
      const id = param.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.loadStockAdjustment(id);
      }
    });
  }

  saForm = form(this.saModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.warehouseId, { message: 'Warehouse is required' });
    required(schema.reason, { message: 'Reason is required' });
    required(schema.adjustmentDateUI, { message: 'Adjustment Date is required' });

    applyEach(schema.lines, (line) => {
      required(line.productVariantId, { message: 'Product is required' });

      validate(line.countedQuantity, ({ value }) => {
        const qty = value();
        if (qty == null || qty < 0) {
          return { kind: 'nonNegativeQuantity', message: 'Counted quantity must be greater than or equal to 0' };
        }
        return validateDecimalPlaces(qty);
      });
    });
  });

  updateField<K extends keyof StockAdjustmentDto>(field: K, value: StockAdjustmentDto[K]) {
    this.saModel.update(prev => this.saService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof StockAdjustmentLineDto>(
    index: number,
    field: K,
    value: StockAdjustmentLineDto[K]
  ) {
    this.saModel.update(prev => this.saService.updateLineField(prev, index, field, value));
  }

  validateLines(): boolean {
    const errs = this.saService.validateStockAdjustmentLines(
      this.saModel().lines,
      this.saModel().reason
    );
    this.errors.set(errs);
    return errs.length === 0;
  }

  onCountedQuantityChange(): void {
    if (this.errors().length > 0) {
      this.validateLines();
    }
  }

  onReasonChange(reason: StockAdjustmentReason | null): void {
    this.updateField('reason', reason);
    if (this.errors().length > 0) {
      this.validateLines();
    }
  }

  addLine(): void {
    const index = this.saModel().lines.length - 1;
    const line = this.saForm.lines[index];

    const isInvalid = line.productVariantId().invalid() || line.countedQuantity().invalid();
    if (isInvalid) {
      line.productVariantId().markAsTouched();
      line.countedQuantity().markAsTouched();
      return;
    }

    if (!this.validateLines()) {
      return;
    }

    this.saModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.saService.createDefaultSAline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.saModel.update(prev => this.saService.deleteLine(prev, lineIndex));
    if (this.errors().length > 0) {
      this.validateLines();
    }
  }

  onWarehouseChange(warehouseId: number | null): void {
    this.updateField('warehouseId', warehouseId);

    // If locations are not enabled, don't manage locations
    if (!this.enableLocation()) {
      this.refreshAvailableStockForAllLines();
      return;
    }

    // Reset location for all lines
    this.saModel.update(prev => {
      const lines = prev.lines.map(line => ({
        ...line,
        warehouseLocationId: null
      }));
      return { ...prev, lines };
    });

    if (warehouseId == null) {
      this.refreshAvailableStockForAllLines();
      return;
    }

    if (!this.warehouseLocations()[warehouseId]) {
      this.loadWarehouseLocations(warehouseId);
    }

    this.refreshAvailableStockForAllLines();
  }

  onLocationChange(index: number, locationId: number | null): void {
    this.updateLineField(index, 'warehouseLocationId', locationId);
    const line = this.saModel().lines[index];
    const whId = this.saModel().warehouseId;
    if (line.productVariantId && whId) {
      this.fetchAvailableStock(index, whId, line.productVariantId, locationId);
    }
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

  loadSALocationsIfRequired(): void {
    if (!this.enableLocation()) {
      return;
    }
    const whId = this.saModel().warehouseId;
    if (whId != null && !this.warehouseLocations()[whId]) {
      this.loadWarehouseLocations(whId);
    }
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

  onProductVariantModelChange(index: number, event: any) {
    if (!event) {
      this.onProductVariantChange(index, null);
    } else if (event.id) {
      this.updateLineField(index, 'productVariantId', event.id);
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
    this.saModel.update(prev => {
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

    const whId = this.saModel().warehouseId;
    const locId = this.saModel().lines[index].warehouseLocationId;
    if (whId && product.id) {
      this.fetchAvailableStock(index, whId, product.id, locId);
    }
  }

  searchBarcode(index: number, event: Event) {
    if (!this.enableBarcode()) {
      return;
    }
    event.preventDefault();

    const barcode = this.saModel().lines[index].barcode?.trim();
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
          if (this.errors().length > 0) {
            this.validateLines();
          }
        },
        error: () => {
          this.updateLineField(index, 'availableQuantity', 0);
          if (this.errors().length > 0) {
            this.validateLines();
          }
        }
      });
  }

  refreshAvailableStockForAllLines(): void {
    const whId = this.saModel().warehouseId;
    if (!whId) {
      this.saModel.update(prev => ({
        ...prev,
        lines: prev.lines.map(l => ({ ...l, availableQuantity: 0 }))
      }));
      return;
    }

    this.saModel().lines.forEach((line, i) => {
      if (line.productVariantId) {
        const locId = line.warehouseLocationId;
        this.fetchAvailableStock(i, whId, line.productVariantId, locId);
      }
    });
  }

  loadFormLookups(): void {
    this.saService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.warehouses.set(res.warehouses ?? []);
          this.enableBarcode.set(res.enableBarcode ?? false);
          this.enableLocation.set(res.enableLocations ?? false);
          this.loadSALocationsIfRequired();
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
                this.loadSALocationsIfRequired();
              }
            });
        }
      });
  }

  loadStockAdjustment(id: string) {
    this.saService.getSAById(id)
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

          data.adjustmentDateUI = data.adjustmentDate ? new Date(data.adjustmentDate) : null;
          this.saModel.set(data);
          this.loadSALocationsIfRequired();

          if (data.warehouseId) {
            data.lines.forEach((line, idx) => {
              if (line.productVariantId && (line.availableQuantity == null || line.availableQuantity === 0)) {
                this.fetchAvailableStock(idx, data.warehouseId!, line.productVariantId, line.warehouseLocationId);
              }
            });
          }
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'stockadjustmentlist']);
        }
      });
  }

  submitSA(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.saForm().invalid()) {
      this.saForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});

    if (!this.validateLines()) {
      this.submit.set(false);
      return;
    }

    const formvalue = this.saForm().value() as StockAdjustmentDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.saService.saveSA(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'stockadjustmentlist']);
            this.base.globalMessage('success', 'Stock Adjustment Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Stock Adjustment Added Successfully', false);
          this.saModel.set(this.saService.createDefaultSA());
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
