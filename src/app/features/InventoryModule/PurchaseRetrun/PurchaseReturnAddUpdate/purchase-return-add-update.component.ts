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
import { AutoDropdown, TaxDropDown } from '../../../../Models/Pagination.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { enumToOptions } from '../../../../shared/Utility';
import { filterNewSourceLines } from '../../../../Models/Inventory/SourceModuleConfig.model';
import { PurchaseReturnService } from '../../../../services/Inventory/PurchaseRetrun.service';
import { PurchaseReturnDto, PurchaseReturnLineDto, PurchaseReturnReason, PurchaseReturnSourceModule } from '../../../../Models/Inventory/PurchaseRetrun.model';

@Component({
  selector: 'app-purchase-return-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './purchase-return-add-update.component.html',
  styleUrl: './purchase-return-add-update.component.css',
})
export class PurchaseReturnAddUpdateComponent {
  suppliers = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);
  enableLocation = signal<boolean>(false);

  private purchaseReturnService = inject(PurchaseReturnService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  isEditMode = signal<boolean>(false);

  purchaseReturnModel = signal<PurchaseReturnDto>(this.purchaseReturnService.createDefaultPR());
  sourceModules = signal(enumToOptions(PurchaseReturnSourceModule, true));
  returnReasons = signal(enumToOptions(PurchaseReturnReason, true))


  // Source Document AutoComplete-
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

  // Computed discount amounts per line
  lineDiscountAmounts = computed(() => {
    return this.purchaseReturnModel().lines.map((line) => {
      const qty = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
      const gross = qty * rate;
      const disc = (line.discountPercentage != null && !isNaN(Number(line.discountPercentage))) ? Number(line.discountPercentage) : 0;
      return gross > 0 ? Number(((gross * disc) / 100).toFixed(2)) : 0;
    });
  });

  // Computed GrandTotal including discount and tax calculation
  grandTotal = computed(() => {
    const taxes = this.taxMap();

    const total = this.purchaseReturnModel().lines.reduce((acc, line) => {
      const quantity = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
      const discountPercentage = (line.discountPercentage != null && !isNaN(Number(line.discountPercentage))) ? Number(line.discountPercentage) : 0;

      const discountAmount = (quantity * rate) * (discountPercentage / 100);
      const taxableAmount = (quantity * rate) - discountAmount;

      const taxRate = line.taxId != null ? (taxes.get(line.taxId) ?? 0) : 0;
      const taxAmount = taxableAmount * (taxRate / 100);

      return acc + taxableAmount + taxAmount;
    }, 0);

    return isNaN(total) ? 0 : Number(total.toFixed(2));
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
    required(schema.name, { message: 'Name is required' });
    required(schema.sourceModule, { message: 'Source Module is required' });
    required(schema.supplierId, { message: 'Supplier is required' });
    required(schema.dateUI, { message: 'Date is required' });

    applyEach(schema.lines, (line) => {
      required(line.reason, { message: 'Reason is required' });
      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty <= 0) {
          return {
            kind: 'positiveQuantity',
            message: 'Quantity must be greater than 0'
          };
        }

        const available = valueOf(line.availableQuantity);
        if (available != null && available > 0 && qty > available) {
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
            this.router.navigate(['Inventory', 'purchasereturnlist']);
            this.base.globalMessage('success', 'Purchase Return Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Purchase Return Added Successfully', false);
          this.purchaseReturnModel.set(this.purchaseReturnService.createDefaultPR());

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
          data.lines.forEach(l => {
            l.reasonNote = l.reasonNote ?? '';
          });
          this.purchaseReturnModel.set(data);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'purchasereturnlist']);
        }
      });
  }

  // Source Document AutoComplete Search
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

          lines.forEach(l => {
            l.reasonNote = l.reasonNote ?? '';
          });

          const { newLines, hasDuplicates } = filterNewSourceLines(this.purchaseReturnModel().lines, lines);

          if (hasDuplicates) {
            this.errors.set([config.duplicateError]);
            return;
          }

          this.errors.set([]);
          this.purchaseReturnModel.update(prev => ({
            ...prev,
            lines: [
              ...prev.lines,
              ...newLines.map(l => ({
                ...l,
                discountPercentage: l.discountPercentage != null && !isNaN(Number(l.discountPercentage))
                  ? Number(Number(l.discountPercentage).toFixed(2))
                  : 0
              }))
            ]
          }));
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
