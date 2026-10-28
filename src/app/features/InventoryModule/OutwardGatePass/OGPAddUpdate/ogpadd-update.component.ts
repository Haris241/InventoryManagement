import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, required, validate } from '@angular/forms/signals';
import { FloatLabel } from "primeng/floatlabel";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { enumToOptions } from '../../../../shared/Utility';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';
import { filterNewSourceLines } from '../../../../Models/Inventory/SourceModuleConfig.model';
import { OGPService } from '../../../../services/Inventory/OGP.service';
import { OGPFormLookupsDto, OutwardGatePassDto, OutwardGatePassLineDto, OutwardGatePassSourceModule } from '../../../../Models/Inventory/OGP.model';
import { DataLayerService } from '../../../../services/data-layer.service';

@Component({
  selector: 'app-ogpadd-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule, CheckboxModule],
  templateUrl: './ogpadd-update.component.html',
  styleUrl: './ogpadd-update.component.css',
})
export class OGPAddUpdateComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  suppliers = signal<AutoDropdown[]>([]);
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);

  private ogpService = inject(OGPService);
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
  warehouseLocations = signal<Record<number, AutoDropdown[]>>({});

  ogpModel = signal<OutwardGatePassDto>(this.ogpService.createDefaultOGP());

  // Global Search for Product Variants (General source)
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  sourceModules = signal(enumToOptions(OutwardGatePassSourceModule, true));

  // Source Document AutoComplete
  sourceConfigs = this.ogpService.getSourceConfigs();
  sourceDocumentId = signal<string | null>(null);

  currentSourceConfig = computed(() => {
    const source = this.ogpModel().sourceModule;
    return source != null ? this.sourceConfigs[source] ?? null : null;
  });

  isGeneralSource = computed(
    () => this.ogpModel().sourceModule === OutwardGatePassSourceModule.General
  );

  totalQuantity = computed(() => {
    return this.ogpModel().lines.reduce((total, line) => {
      const qty = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      return total + qty;
    }, 0);
  });

  ngOnInit() {
    this.loadFormLookups();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadOGP(id);
        }
      });
  }

  ogpForm = form(this.ogpModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.sourceModule, { message: 'Source Module is required' });
    required(schema.exitDateTime, { message: 'Exit Date is required' });

    validate(schema.supplierId, ({ value, valueOf }) => {
      const supplierId = value();
      const sourceModule = valueOf(schema.sourceModule);

      if (sourceModule === OutwardGatePassSourceModule.PurchaseReturn && !supplierId) {
        return { kind: 'required', message: 'Supplier is required' };
      }
      return undefined;
    });

    applyEach(schema.lines, (line) => {
      required(line.wareHouseId, { message: 'Warehouse is required' });
      required(line.productVariantId, { message: 'Product is required' });

      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty <= 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Quantity must be greater than 0'
          };
        }

        if (this.ogpModel().sourceModule === OutwardGatePassSourceModule.PurchaseReturn) {
          const available = valueOf(line.availableQuantity);
          if (available != null && available > 0 && qty > available) {
            return { kind: 'prQuantityExceeded', message: `Quantity cannot be greater than Available quantity (${available}).` };
          }
        }
        return null;
      });
    });
  });

  updateField<K extends keyof OutwardGatePassDto>(field: K, value: OutwardGatePassDto[K]) {
    this.ogpModel.update(prev => this.ogpService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof OutwardGatePassLineDto>(
    index: number,
    field: K,
    value: OutwardGatePassLineDto[K]
  ) {
    this.ogpModel.update(prev => this.ogpService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    const index = this.ogpModel().lines.length - 1;
    if (index >= 0) {
      const line = this.ogpForm.lines[index];
      const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.quantity().invalid();

      if (isInvalid) {
        line.wareHouseId().markAsTouched();
        line.productVariantId().markAsTouched();
        line.quantity().markAsTouched();
        return;
      }
    }

    this.ogpModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.ogpService.createDefaultOGPline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.ogpModel.update(prev => this.ogpService.deleteLine(prev, lineIndex));
  }

  createOGP(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.ogpForm().invalid()) {
      this.ogpForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.ogpForm().value() as OutwardGatePassDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.ogpService.saveOGP(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'ogplist']);
            this.base.globalMessage('success', 'Outward Gate Pass Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Outward Gate Pass Added Successfully', false);
          this.ogpModel.set(this.ogpService.createDefaultOGP());

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

  loadFormLookups(): void {
    this.ogpService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: OGPFormLookupsDto) => {
          this.suppliers.set(res.suppliers ?? []);
          this.enableBarcode.set(res.enableBarcode ?? false);
          this.enableLocation.set(res.enableLocations ?? false);

          if (res.warehouses && res.warehouses.length > 0) {
            this.wareHouses.set(res.warehouses);
          } else {
            this.loadWarehousesFallback();
          }
        },
        error: () => {
          this.loadWarehousesFallback();
        }
      });
  }

  private loadWarehousesFallback(): void {
    this.dataService.getAllSimple<AutoDropdown>('DropDowns/WareHouseList')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (whs) => {
          this.wareHouses.set(whs);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadOGP(id: string) {
    this.ogpService.getOGPById(id)
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
              cost: 0,
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!).filter(x => !!x.id)
          );

          data.exitDateTime = data.exitDateTime ? new Date(data.exitDateTime) : null;
          this.ogpModel.set(data);
          this.loadLocationsForLines(data.lines);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'ogplist']);
        }
      });
  }

  // Global Search
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
      return;
    }

    this.setProductVariant(index, product);
  }

  searchBarcode(index: number, event: Event) {
    if (!this.enableBarcode()) {
      return;
    }
    event.preventDefault();

    const barcode = this.ogpModel().lines[index].barcode?.trim();

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

  setProductVariant(index: number, product: ProductVariantSearchDto) {
    this.ogpModel.update(prev => {
      const lines = [...prev.lines];
      lines[index] = {
        ...lines[index],
        selectedProductVariant: product,
        productVariantId: product.id,
        productName: product.displayName ?? '',
        barcode: product.barcode ?? '',
        uom: product.uom ?? ''
      };
      return { ...prev, lines };
    });
  }

  loadSourceLines(docId: string) {
    const config = this.currentSourceConfig();
    if (!config) return;

    config.fetchLines(docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          if (!lines || lines.length === 0) return;

          const incomingSupplierId = lines.find(l => !!l.supplierId)?.supplierId;
          const currentSupplierId = this.ogpModel().supplierId;

          if (incomingSupplierId) {
            if (currentSupplierId && currentSupplierId !== incomingSupplierId) {
              this.errors.set(['The selected source document belongs to a different supplier than the currently selected supplier.']);
              return;
            }

            if (!currentSupplierId) {
              this.updateField('supplierId', incomingSupplierId);
            }
          }

          const { newLines, hasDuplicates } = filterNewSourceLines(this.ogpModel().lines, lines);

          if (hasDuplicates) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.ogpModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
          this.loadLocationsForLines(newLines);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  onSourceModuleChange(sourceModule: OutwardGatePassSourceModule): void {
    this.updateField('sourceModule', sourceModule);

    // Clear existing lines whenever source module changes
    this.ogpModel.update(prev => ({
      ...prev,
      lines: sourceModule === OutwardGatePassSourceModule.General
        ? [this.ogpService.createDefaultOGPline([])]
        : []
    }));
    // Clear selected source document
    this.sourceDocumentId.set(null);
  }

  loadLocationsForLines(lines: OutwardGatePassLineDto[]): void {
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
