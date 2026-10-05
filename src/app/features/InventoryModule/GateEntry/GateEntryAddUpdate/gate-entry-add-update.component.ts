import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
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
import { GateEntryService } from '../../../../services/Inventory/GateEntry.service';
import { GateEntryDto, GateEntryLineDto, GateEntrySourceModule } from '../../../../Models/Inventory/GateEntry.model';

@Component({
  selector: 'app-gate-entry-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './gate-entry-add-update.component.html',
  styleUrl: './gate-entry-add-update.component.css',
})
export class GateEntryAddUpdateComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  suppliers = signal<AutoDropdown[]>([]);
  enableBarcode = signal<boolean>(false);

  private geService = inject(GateEntryService);
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

  geModel = signal<GateEntryDto>(this.geService.createDefaultGE());
  //for Global Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  sourceModules = signal(enumToOptions(GateEntrySourceModule, true));

  //PO Search AutoComplete
  poSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseOrderListApproved');
  poSearchList = this.poSearch.result;
  poId = signal<string | null>(null);
  isGeneralSource = computed(
    () => this.geModel().sourceModule === GateEntrySourceModule.General
  );

  ngOnInit() {
    this.loadFormLookups();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadGateEntry(id);
        }
      });
  }

  geForm = form(this.geModel, (schema) => {
    required(schema.name, { message: 'Name is required', });
    required(schema.sourceModule, { message: 'Source Module is required', });
    validate(schema.supplierId, ({ value, valueOf }) => {
      const supplierId = value();
      const sourceModule = valueOf(schema.sourceModule);

      if (sourceModule !== GateEntrySourceModule.General && !supplierId) {
        return { kind: 'required', message: 'Supplier is required', };
      }

      return undefined;
    });
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

        if (this.geModel().sourceModule === GateEntrySourceModule.PurchaseOrder) {
          const available = valueOf(line.availableQuantity) ?? 0;

          if (qty > available) {
            return { kind: 'poQuantityExceeded', message: `Quantity cannot be greater than PO quantity.` };
          }
        }
        return null;
      });

    });
  });

  updateField<K extends keyof GateEntryDto>(field: K, value: GateEntryDto[K]) {
    this.geModel.update(prev => this.geService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof GateEntryLineDto>(
    index: number,
    field: K,
    value: GateEntryLineDto[K]
  ) {
    this.geModel.update(prev => this.geService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    const index = this.geModel().lines.length - 1;
    const line = this.geForm.lines[index];

    //Mark required field 
    const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.quantity().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.wareHouseId().markAsTouched();
      line.productVariantId().markAsTouched();
      line.quantity().markAsTouched();
      return;
    }

    this.geModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.geService.createDefaultGEline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.geModel.update(prev => this.geService.deleteLine(prev, lineIndex));
  }



  createGE(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.geForm().invalid()) {
      this.geForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.geForm().value() as GateEntryDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.geService.saveGE(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'gateentrylist']);
            this.base.globalMessage('success', 'Gate Entry Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Gate Entry Added Successfully', false);
          this.geModel.set(this.geService.createDefaultGE());

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
    this.geService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.suppliers.set(res.suppliers);
          this.enableBarcode.set(res.enableBarcode);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadGateEntry(id: string) {
    this.geService.getGEById(id)
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

          data.entryDateUI = data.entryDate ? new Date(data.entryDate) : null;
          this.geModel.set(data);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'gateentrylist']);
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

    const barcode = this.geModel().lines[index].barcode?.trim();

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
  getPOLines(prId: string) {
    this.geService.getPOLines(prId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          const existingPrLineIds = new Set(
            this.geModel().lines.map(line => line.sourceRowId).filter((id): id is string => !!id)
          );

          const newLines = lines.filter(line => line.sourceRowId && !existingPrLineIds.has(line.sourceRowId));

          if (lines.length > 0 && newLines.length === 0) {
            this.errors.set(['The selected Purchase Order has already been added.']);
            return;
          }

          this.errors.set([]);
          this.geModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  setProductVariant(index: number, product: ProductVariantSearchDto) {
    this.geModel.update(prev => {
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

  onSourceModuleChange(sourceModule: GateEntrySourceModule): void {
    this.updateField('sourceModule', sourceModule);

    // Clear existing lines whenever source module changes
    this.geModel.update(prev => ({
      ...prev, lines: sourceModule === GateEntrySourceModule.General
        ? [this.geService.createDefaultGEline([])] : []
    }));
    // Clear selected PR
    this.poId.set(null);
  }
}
