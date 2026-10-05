import { Component, computed, DestroyRef, inject, signal, Signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, readonly, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { AutoDropdown, TaxDropDown } from '../../../../Models/Pagination.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { enumToOptions } from '../../../../shared/Utility';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { PurchaseOrderService } from '../../../../services/Inventory/PurchaseOrder.service';
import { PurchaseOrderDto, PurchaseOrderLineDto, PurchaseOrderSourceModule } from '../../../../Models/Inventory/PurchaseOrder.model';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';

interface POSourceModuleConfig {
  label: string;
  search: {
    searchterm: WritableSignal<string>;
    result: Signal<AutoDropdown[]>;
    setInitialValue?: (items: AutoDropdown[]) => void;
  };
  fetchLines: (id: string) => Observable<PurchaseOrderLineDto[]>;
  duplicateError: string;
}

@Component({
  selector: 'app-purchase-order',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './purchase-order.component.html',
  styleUrl: './purchase-order.component.css',
})
export class PurchaseOrderComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  suppliers = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);
  postingPoint = signal<boolean>(false);
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);

  private poService = inject(PurchaseOrderService);
  private productSearchService = inject(ProductSearchService);
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
  warehouseLocations = signal<Record<number, AutoDropdown[]>>({});

  poModel = signal<PurchaseOrderDto>(this.poService.createDefaultPO());
  //for Global Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  sourceModules = signal(enumToOptions(PurchaseOrderSourceModule, true));

  // Source Document AutoComplete
  sourceDocumentId = signal<string | null>(null);

  readonly sourceConfigs: Partial<Record<PurchaseOrderSourceModule, POSourceModuleConfig>> = {
    [PurchaseOrderSourceModule.PurchaseRequisition]: {
      label: 'Search Purchase Requisition',
      search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseRequisitionListApproved'),
      fetchLines: (id) => this.poService.getPRLines(id),
      duplicateError: 'The selected Purchase Requisition has already been added.'
    }
  };

  currentSourceConfig = computed(() => {
    const source = this.poModel().sourceModule;
    return source != null ? this.sourceConfigs[source] ?? null : null;
  });

  isGeneralSource = computed(
    () => this.poModel().sourceModule === PurchaseOrderSourceModule.General
  );

  isPurchaseRequisitionSource = computed(
    () => this.poModel().sourceModule === PurchaseOrderSourceModule.PurchaseRequisition
  );
  private taxMap = computed(() => {
    const map = new Map<string | number, number>();

    for (const tax of this.taxes()) {
      if (tax.id != null) {
        map.set(tax.id, tax.rate);
      }
    }

    return map;
  });

  // 2. Computed GrandTotal using the safe lookup
  grandTotal = computed(() => {
    const taxes = this.taxMap();

    return this.poModel().lines.reduce((total, line) => {
      const quantity = line.quantity ?? 0;
      const rate = line.rate ?? 0;
      const discountPercentage = line.discountPercentage ?? 0;

      const taxableAmount = (quantity * rate) - discountPercentage;

      // Check if line.taxId is present and look up in map
      const taxRate = line.taxId != null ? (taxes.get(line.taxId) ?? 0) : 0;
      const taxAmount = taxableAmount * (taxRate / 100);

      return total + taxableAmount + taxAmount;
    }, 0);
  });



  ngOnInit() {
    this.loadFormLookups();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadPurchaseOrder(id);
        }
      });
  }

  poForm = form(this.poModel, (schema) => {
    required(schema.name, { message: 'Name is required', });
    required(schema.supplierId, { message: 'Supplier is required', });
    required(schema.sourceModule, { message: 'Source Module is required', });
    applyEach(schema.lines, (line) => {
      required(line.wareHouseId, { message: 'Warehouse is required', });
      required(line.productVariantId, { message: 'Product is required', });
      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty <= 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Quantity must be greater than 0'
          };
        }

        if (this.poModel().sourceModule === PurchaseOrderSourceModule.PurchaseRequisition) {
          const available = valueOf(line.availableQuantity) ?? 0;

          if (qty > available) {
            return { kind: 'prQuantityExceeded', message: `Quantity cannot be greater than PR quantity.` };
          }
        }
        return null;
      });


      validate(line.rate, ({ value }) => {
        const rate = value();
        if (rate == null || rate <= 0) {
          return { kind: 'positiveQuantity', message: 'Rate must be greater than 0' };
        }
        return null;
      });
      validate(line.discountPercentage, ({ value }) => {
        const discountPercentage = value();
        if (discountPercentage == null || discountPercentage < 0) {
          return { kind: 'positiveQuantity', message: 'Discount must be greater than or equal to 0' };
        }
        return null;
      });
    });
  });

  updateField<K extends keyof PurchaseOrderDto>(field: K, value: PurchaseOrderDto[K]) {
    this.poModel.update(prev => this.poService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof PurchaseOrderLineDto>(
    index: number,
    field: K,
    value: PurchaseOrderLineDto[K]
  ) {
    this.poModel.update(prev => this.poService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    const index = this.poModel().lines.length - 1;
    const line = this.poForm.lines[index];

    //Mark required field 
    const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.quantity().invalid() || line.rate().invalid() || line.discountPercentage().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.wareHouseId().markAsTouched();
      line.productVariantId().markAsTouched();
      line.quantity().markAsTouched();
      line.rate().markAsTouched();
      line.discountPercentage().markAsTouched();
      return;
    }

    this.poModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.poService.createDefaultPOline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.poModel.update(prev => this.poService.deleteLine(prev, lineIndex));
  }



  createPo(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.poForm().invalid()) {
      this.poForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.poForm().value() as PurchaseOrderDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.poService.savePO(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'purchaseorderlist']);
            this.base.globalMessage('success', 'Purchase Order Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Purchase Order Added Successfully', false);
          this.poModel.set(this.poService.createDefaultPO());

          this.submit.set(false);
          this.formSubmitted.set(false);
        },
        error: (err) => {
          if (err.error.errors) {
            this.backendErrors.set(err.error.errors);
          } else {
            this.base.handleError(err, err.error.message);
          }
          this.submit.set(false);
        }
      });
  }

  loadFormLookups(): void {
    this.poService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.suppliers.set(res.suppliers);
          this.taxes.set(res.taxes);
          this.postingPoint.set(res.postingPoint);
          this.enableBarcode.set(res.enableBarcode);
          this.enableLocation.set(res.enableLocations);
          this.loadPOLocationsIfRequired();
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadPurchaseOrder(id: string) {
    this.poService.getPOById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          //Bind selected Product} Id with Auto complete
          data.lines.forEach(line => {
            line.selectedProductVariant = {
              id: line.productVariantId!,
              displayName: line.productName,
              barcode: line.barcode,
              uom: line.uom,
              sku: "",
              cost: line.rate
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!)
          );

          data.purchaseDateUI = data.purchaseDate ? new Date(data.purchaseDate) : null;
          data.expectedDeliveryDateUI = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null;
          this.poModel.set(data);
          this.loadPOLocationsIfRequired();
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'purchaseorderlist']);
        }
      });
  }
  loadPOLocationsIfRequired(): void {
    if (!this.postingPoint()) {
      return;
    }

    const lines = this.poModel().lines;

    if (lines.length > 0) {
      this.loadLocationsForLines(lines);
    }
  }

  //Global Search
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }


  onProductVariantChange(index: number, product: ProductVariantSearchDto | null) {
    if (!product) {
      this.updateLineField(index, 'productVariantId', null);
      return;
    }

    this.setProductVariant(index, product);
  }
  searchBarcode(index: number, event: Event) {
    if (!this.enableBarcode()) {
      return;
    }
    event.preventDefault();

    const barcode = this.poModel().lines[index].barcode?.trim();

    if (!barcode) {
      return;
    }

    this.getProductVariantByBarcode(index, barcode);
  }

  getProductVariantByBarcode(index: number, barcode: string) {
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
  loadSourceLines(docId: string) {
    const config = this.currentSourceConfig();
    if (!config) return;

    config.fetchLines(docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          const existingPrLineIds = new Set(
            this.poModel().lines.map(line => line.sourceRowId).filter((id): id is string => !!id)
          );

          const newLines = lines.filter(line => line.sourceRowId && !existingPrLineIds.has(line.sourceRowId));

          if (lines.length > 0 && newLines.length === 0) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.poModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
          if (this.postingPoint()) {
            this.loadLocationsForLines(newLines);
          }
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }
  loadLocationsForLines(lines: PurchaseOrderLineDto[]): void {
    const warehouseIds = [
      ...new Set(
        lines.map(line => line.wareHouseId).filter((id): id is number => id != null)
      )
    ];

    warehouseIds.forEach(warehouseId => {
      if (!this.warehouseLocations()[warehouseId]) {
        this.loadWarehouseLocations(warehouseId);
      }
    });
  }

  setProductVariant(index: number, product: ProductVariantSearchDto) {
    this.poModel.update(prev => {
      const lines = [...prev.lines];
      lines[index] = {
        ...lines[index],
        selectedProductVariant: product,
        productVariantId: product.id,
        barcode: product.barcode ?? '',
        uom: product.uom ?? '',
        rate: product.cost
      };
      return { ...prev, lines };
    });
  }
  onWarehouseChange(index: number, warehouseId: number | null): void {
    this.updateLineField(index, 'wareHouseId', warehouseId);

    // If posting point/location is not enabled, don't manage warehouse locations
    if (!this.postingPoint() || !this.enableLocation()) {
      return;
    }
    // Warehouse changed, so reset the previous location
    this.updateLineField(index, 'warehouseLocationId', null);
    // No warehouse selected
    if (warehouseId == null) {
      return;
    }
    // Locations already loaded for this warehouse
    if (this.warehouseLocations()[warehouseId]) {
      return;
    }

    this.loadWarehouseLocations(warehouseId);
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
  onSourceModuleChange(sourceModule: PurchaseOrderSourceModule): void {
    this.updateField('sourceModule', sourceModule);

    // Clear existing lines whenever source module changes
    this.poModel.update(prev => ({
      ...prev, lines: sourceModule === PurchaseOrderSourceModule.General
        ? [this.poService.createDefaultPOline([])] : []
    }));
    // Clear selected source document
    this.sourceDocumentId.set(null);
  }

}
