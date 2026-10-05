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
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { PurchaseRequisitionService } from '../../../../services/Inventory/PurchaseRequisition.service';
import { PurchaseRequisitionDto, PurchaseRequisitionLineDto, SourceModule } from '../../../../Models/Inventory/PurchaseRequisition.model';
import { PaginationService } from '../../../../services/pagination.service';
import { enumToOptions } from '../../../../shared/Utility';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';

interface PRSourceModuleConfig {
  label: string;
  search: {
    searchterm: WritableSignal<string>;
    result: Signal<AutoDropdown[]>;
    setInitialValue?: (items: AutoDropdown[]) => void;
  };
  fetchLines: (id: string) => Observable<PurchaseRequisitionLineDto[]>;
  duplicateError: string;
}


@Component({
  selector: 'app-purchase-requisition',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './purchase-requisition.component.html',
  styleUrl: './purchase-requisition.component.css',
})
export class PurchaseRequisitionComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  departments = signal<AutoDropdown[]>([]);
  enableBarcode = signal<boolean>(false);

  private prService = inject(PurchaseRequisitionService);
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
  prModel = signal<PurchaseRequisitionDto>(this.prService.createDefaultPR());
  //for Global Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  sourceModules = signal(enumToOptions(SourceModule, true));

  // Source Document AutoComplete
  sourceDocumentId = signal<string | null>(null);

  readonly sourceConfigs: Partial<Record<SourceModule, PRSourceModuleConfig>> = {
    // Configs for ProductionOrder, ExportOrder, SalesOrder can be added here
  };

  currentSourceConfig = computed(() => {
    const source = this.prModel().sourceModule;
    return source != null ? this.sourceConfigs[source] ?? null : null;
  });

  isGeneralSource = computed(
    () => this.prModel().sourceModule === SourceModule.General
  );



  ngOnInit() {
    this.loadFormLookups();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadPurchaseRequisition(id);
        }
      });
  }

  prForm = form(this.prModel, (schema) => {
    required(schema.name, { message: 'Name is required', });
    applyEach(schema.lines, (line) => {
      required(line.wareHouseId, { message: 'Warehouse is required', });
      required(line.productVariantId, { message: 'Product is required', });
      readonly(line.uom);
      validate(line.quantity, ({ value }) => {
        const qty = value();
        if (qty == null || qty <= 0) {
          return { kind: 'positiveQuantity', message: 'Quantity must be greater than 0' };
        }
        return null;
      });
    });
  });

  updateField<K extends keyof PurchaseRequisitionDto>(field: K, value: PurchaseRequisitionDto[K]) {
    this.prModel.update(prev => this.prService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof PurchaseRequisitionLineDto>(
    index: number,
    field: K,
    value: PurchaseRequisitionLineDto[K]
  ) {
    this.prModel.update(prev => this.prService.updateLineField(prev, index, field, value));
  }

  addLine(): void {
    const index = this.prModel().lines.length - 1;
    const line = this.prForm.lines[index];

    //Mark required field 
    const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.quantity().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.wareHouseId().markAsTouched();
      line.productVariantId().markAsTouched();
      line.quantity().markAsTouched();
      return;
    }

    this.prModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.prService.createDefaultPRLine(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.prModel.update(prev => this.prService.deleteLine(prev, lineIndex));
  }



  createPr(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.prForm().invalid()) {
      this.prForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.prForm().value() as PurchaseRequisitionDto;

    this.prService.savePr(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'purchaserequisitionlist']);
            this.base.globalMessage('success', 'Purchase Requisition Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Purchase Requisition Added Successfully', false);
          this.prModel.set(this.prService.createDefaultPR());

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
    this.prService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.departments.set(res.departments);
          this.enableBarcode.set(res.enableBarcode);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadPurchaseRequisition(id: string) {
    this.prService.getPRById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          //Bind selected Product} Id with Auto complete
          data.lines.forEach(line => {
            line.selectedProductVariant = {
              id: line.productVariantId!,
              displayName: line.productVariantName ?? "",
              barcode: line.barcode,
              uom: line.uom,
              sku: "",
              cost: 0
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!)
          );

          data.dateUI = data.date ? new Date(data.date) : null;
          this.prModel.set(data);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'purchaserequisitionlist']);
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

    const barcode = this.prModel().lines[index].barcode?.trim();

    if (!barcode) {
      return;
    }

    this.getProductVariantByBarcode(index, barcode);
  }

  private getProductVariantByBarcode(index: number, barcode: string) {
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
    this.prModel.update(prev => {
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

  loadSourceLines(docId: string) {
    const config = this.currentSourceConfig();
    if (!config) return;

    config.fetchLines(docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          const existingPrLineIds = new Set(
            this.prModel().lines.map(line => line.sourceRowId).filter((id): id is string => !!id)
          );

          const newLines = lines.filter(line => line.sourceRowId && !existingPrLineIds.has(line.sourceRowId));

          if (lines.length > 0 && newLines.length === 0) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.prModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  onSourceModuleChange(sourceModule: SourceModule): void {
    this.updateField('sourceModule', sourceModule);

    // Clear existing lines whenever source module changes
    this.prModel.update(prev => ({
      ...prev, lines: sourceModule === SourceModule.General
        ? [this.prService.createDefaultPRLine([])] : []
    }));
    // Clear selected source document
    this.sourceDocumentId.set(null);
  }
}
