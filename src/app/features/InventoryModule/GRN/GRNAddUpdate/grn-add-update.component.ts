import { Component, computed, DestroyRef, inject, signal, Signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, required, validate } from '@angular/forms/signals';
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
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';
import { GrnService } from '../../../../services/Inventory/GRN.service';
import { GRNDto, GRNLineDto, GRNSourceModule } from '../../../../Models/Inventory/GRN.model';

interface SourceModuleConfig {
  label: string;
  search: {
    searchterm: WritableSignal<string>;
    result: Signal<AutoDropdown[]>;
    setInitialValue?: (items: AutoDropdown[]) => void;
  };
  fetchLines: (id: string) => Observable<GRNLineDto[]>;
  duplicateError: string;
  isPriceReadonly?: (line: GRNLineDto) => boolean;
}

@Component({
  selector: 'app-grn-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './grn-add-update.component.html',
  styleUrl: './grn-add-update.component.css',
})
export class GrnAddUpdateComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  suppliers = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);
  requirePOForGRN = signal<boolean>(false);

  private grnService = inject(GrnService);
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


  grnModel = signal<GRNDto>(this.grnService.createDefaultGRN());
  //for Global Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  sourceModules = signal(enumToOptions(GRNSourceModule, true));

  // Source Document AutoComplete
  sourceDocumentId = signal<string | null>(null);

  readonly sourceConfigs: Partial<Record<GRNSourceModule, SourceModuleConfig>> = {
    [GRNSourceModule.PurchaseOrder]: {
      label: 'Search Purchase Order',
      search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseOrderListApproved'),
      fetchLines: (id) => this.grnService.getPOLines(id),
      duplicateError: 'The selected Purchase Order has already been added.',
      isPriceReadonly: () => true
    },
    [GRNSourceModule.GateEntry]: {
      label: 'Search Gate Entry',
      search: this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/GateEntryListApproved'),
      fetchLines: (id) => this.grnService.getGELines(id),
      duplicateError: 'The selected Gate Entry has already been added.',
      isPriceReadonly: (line) => !!line.isPOBasedGE
    }
  };

  currentSourceConfig = computed(() => {
    const source = this.grnModel().sourceModule;
    return source != null ? this.sourceConfigs[source] ?? null : null;
  });

  isGeneralSource = computed(
    () => this.grnModel().sourceModule === GRNSourceModule.General
  );

  isLinePriceReadonly(line: GRNLineDto): boolean {
    const config = this.currentSourceConfig();
    return config?.isPriceReadonly ? config.isPriceReadonly(line) : false;
  }

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

    return this.grnModel().lines.reduce((total, line) => {
      const quantity = line.acceptedQuantity ?? 0;
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
          this.loadGRN(id);
        }
      });
  }

  grnForm = form(this.grnModel, (schema) => {
    required(schema.name, { message: 'Name is required', });
    required(schema.sourceModule, { message: 'Source Module is required', });
    required(schema.supplierId, { message: 'Supplier is required', });
    required(schema.dateUI, { message: 'Date is required', });

    applyEach(schema.lines, (line) => {
      required(line.wareHouseId, { message: 'Warehouse is required', });
      required(line.productVariantId, { message: 'Product is required', });
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
      validate(line.acceptedQuantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty < 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Quantity must be greater than or equal to 0'
          };
        }

        if (this.grnModel().sourceModule === GRNSourceModule.PurchaseOrder || this.grnModel().sourceModule === GRNSourceModule.GateEntry) {
          const available = valueOf(line.availableQuantity) ?? 0;

          if (qty > available) {
            return { kind: 'poQuantityExceeded', message: `Quantity cannot be greater than Available quantity.` };
          }
        }
        return null;
      });

      validate(line.rejectedQuantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty < 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Rejected Quantity must be greater than or equal to 0'
          };
        }

        if (this.grnModel().sourceModule === GRNSourceModule.PurchaseOrder || this.grnModel().sourceModule === GRNSourceModule.GateEntry) {
          const available = valueOf(line.availableQuantity) ?? 0;

          if (qty > available) {
            return { kind: 'rejectedQuantityExceeded', message: `Rejected Quantity cannot be greater than Available quantity.` };
          }
        }
        return null;
      });
    });
  });

  updateField<K extends keyof GRNDto>(field: K, value: GRNDto[K]) {
    this.grnModel.update(prev => this.grnService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof GRNLineDto>(
    index: number,
    field: K,
    value: GRNLineDto[K]
  ) {
    this.grnModel.update(prev => this.grnService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    const index = this.grnModel().lines.length - 1;
    const line = this.grnForm.lines[index];

    //Mark required field 
    const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.acceptedQuantity().invalid()
      || line.rejectedQuantity().invalid() || line.discountPercentage().invalid() || line.rate().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.wareHouseId().markAsTouched();
      line.productVariantId().markAsTouched();
      line.acceptedQuantity().markAsTouched();
      line.rejectedQuantity().markAsTouched();
      line.discountPercentage().markAsTouched();
      line.rate().markAsTouched();

      return;
    }

    this.grnModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.grnService.createDefaultGRNline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.grnModel.update(prev => this.grnService.deleteLine(prev, lineIndex));
  }

  createGRN(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.grnForm().invalid()) {
      this.grnForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.grnForm().value() as GRNDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.grnService.saveGRN(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'grnlist']);
            this.base.globalMessage('success', 'GRN Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'GRN Added Successfully', false);
          this.grnModel.set(this.grnService.createDefaultGRN());

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
    this.grnService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.suppliers.set(res.suppliers);
          this.taxes.set(res.taxes);
          this.enableBarcode.set(res.enableBarcode);
          this.enableLocation.set(res.enableLocations);
          this.requirePOForGRN.set(res.requirePOForGRN);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadGRN(id: string) {
    this.grnService.getGRNById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          //Bind selected Product} Id with Auto complete
          data.lines.forEach(line => {
            line.selectedProductVariant = {
              id: line.productVariantId!,
              displayName: line.productVariantName,
              barcode: line.barcode,
              uom: line.uom,
              sku: "",
              cost: 0,
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!)
          );

          data.dateUI = data.date ? new Date(data.date) : null;
          this.grnModel.set(data);
          this.loadLocationsForLines(data.lines);

        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'grnlist']);
        }
      });
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

    const barcode = this.grnModel().lines[index].barcode?.trim();

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
          const existingLineIds = new Set(
            this.grnModel().lines.map(line => line.sourceRowId).filter((id): id is string => !!id)
          );

          const newLines = lines.filter(line => line.sourceRowId && !existingLineIds.has(line.sourceRowId));

          if (lines.length > 0 && newLines.length === 0) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.grnModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
          this.loadLocationsForLines(newLines);

        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  setProductVariant(index: number, product: ProductVariantSearchDto) {
    this.grnModel.update(prev => {
      const lines = [...prev.lines];
      lines[index] = {
        ...lines[index],
        selectedProductVariant: product,
        productVariantId: product.id,
        barcode: product.barcode ?? '',
        uom: product.uom ?? ''
      };
      return { ...prev, lines };
    });
  }

  onSourceModuleChange(sourceModule: GRNSourceModule): void {
    this.updateField('sourceModule', sourceModule);

    // Clear existing lines whenever source module changes
    this.grnModel.update(prev => ({
      ...prev, lines: sourceModule === GRNSourceModule.General
        ? [this.grnService.createDefaultGRNline([])] : []
    }));
    // Clear selected source document
    this.sourceDocumentId.set(null);
  }
  loadLocationsForLines(lines: GRNLineDto[]): void {
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
  onWarehouseChange(index: number, warehouseId: number | null): void {
    this.updateLineField(index, 'wareHouseId', warehouseId);

    // If posting point/location is not enabled, don't manage warehouse locations
    if (!this.enableLocation()) {
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
}
