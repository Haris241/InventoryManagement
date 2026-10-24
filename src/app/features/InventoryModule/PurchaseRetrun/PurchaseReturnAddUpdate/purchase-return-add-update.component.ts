import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { applyEach, form, FormField, required, validate } from '@angular/forms/signals';
import { FloatLabelModule } from "primeng/floatlabel";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { filterNewSourceLines } from '../../../../Models/Inventory/SourceModuleConfig.model';
import { PurchaseReturnService } from '../../../../services/Inventory/PurchaseRetrun.service';
import { PurchaseReturnDto, PurchaseReturnLineDto, PurchaseReturnSourceModule } from '../../../../Models/Inventory/PurchaseRetrun.model';

@Component({
  selector: 'app-purchase-return-add-update',
  imports: [RouterLink, FloatLabelModule, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './purchase-return-add-update.component.html',
  styleUrl: './purchase-return-add-update.component.css',
})
export class PurchaseReturnAddUpdateComponent {
  suppliers = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);
  enableLocation = signal<boolean>(false);

  private purchaseReturnService = inject(PurchaseReturnService);
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

  purchaseReturnModel = signal<PurchaseReturnDto>(this.purchaseReturnService.createDefaultPR());
  sourceModules = signal(enumToOptions(PurchaseReturnSourceModule, true));

  // Source Document AutoComplete
  sourceConfigs = this.purchaseReturnService.getSourceConfigs();
  sourceDocumentId = signal<string | null>(null);

  currentSourceConfig = computed(() => {
    const source = this.purchaseReturnModel().sourceModule;
    return source != null ? this.sourceConfigs[source] ?? null : null;
  });

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

    const total = this.purchaseReturnModel().lines.reduce((total, line) => {
      const quantity = line.quantity ?? 0;
      const rate = line.rate ?? 0;

      const taxableAmount = (quantity * rate);

      // Check if line.taxId is present and look up in map
      const taxRate = line.taxId != null ? (taxes.get(line.taxId) ?? 0) : 0;
      const taxAmount = taxableAmount * (taxRate / 100);

      return total + taxableAmount + taxAmount;
    }, 0);

    return Number(total.toFixed(2));
  });
  ngOnInit() {
    this.loadFormLookups();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.loadPR(id);
        }
      });
  }

  prForm = form(this.purchaseReturnModel, (schema) => {
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

      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty < 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Quantity must be greater than or equal to 0'
          };
        }

        const available = valueOf(line.availableQuantity) ?? 0;

        if (qty > available) {
          return { kind: 'prQuantityExceeded', message: `Quantity cannot be greater than Available quantity.` };
        }
        return null;
      });

    });
  });

  updateField<K extends keyof PurchaseReturnDto>(field: K, value: PurchaseReturnDto[K]) {
    this.purchaseReturnModel.update(prev => this.purchaseReturnService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof PurchaseReturnLineDto>(
    index: number,
    field: K,
    value: PurchaseReturnLineDto[K]
  ) {
    this.purchaseReturnModel.update(prev => this.purchaseReturnService.updateLineField(prev, index, field, value));
  }



  deleteLine(lineIndex: number): void {
    this.purchaseReturnModel.update(prev => this.purchaseReturnService.deleteLine(prev, lineIndex));
  }

  createPR(event: Event) {
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
    const formvalue = this.prForm().value() as PurchaseReturnDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.purchaseReturnService.savePR(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'prlist']);
            this.base.globalMessage('success', 'PR Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'PR Added Successfully', false);
          this.purchaseReturnModel.set(this.purchaseReturnService.createDefaultPR());

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
    this.purchaseReturnService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.suppliers.set(res.suppliers);
          this.taxes.set(res.taxes);
          this.enableLocation.set(res.enableLocations);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadPR(id: string) {
    this.purchaseReturnService.getPRById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          data.dateUI = data.date ? new Date(data.date) : null;
          this.purchaseReturnModel.set(data);

        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'prlist']);
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



  loadSourceLines(docId: string) {
    const config = this.currentSourceConfig();
    if (!config) return;

    config.fetchLines(docId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          if (!lines || lines.length === 0) return;

          const incomingSupplierId = lines.find(l => !!l.supplierId)?.supplierId;
          const currentSupplierId = this.purchaseReturnModel().supplierId;

          if (incomingSupplierId) {
            if (currentSupplierId && currentSupplierId !== incomingSupplierId) {
              this.errors.set(['The selected source document belongs to a different supplier than the currently selected supplier.']);
              return;
            }

            if (!currentSupplierId) {
              this.updateField('supplierId', incomingSupplierId);
            }
          }

          const { newLines, hasDuplicates } = filterNewSourceLines(this.purchaseReturnModel().lines, lines);

          if (hasDuplicates) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.purchaseReturnModel.update(prev => ({ ...prev, lines: [...prev.lines, ...newLines] }));
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }


  onSourceModuleChange(sourceModule: PurchaseReturnSourceModule): void {
    this.updateField('sourceModule', sourceModule);

    this.purchaseReturnModel.update(prev => ({
      ...prev, lines: []
    }));
    // Clear selected source document
    this.sourceDocumentId.set(null);
  }


}
