import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
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
import { PaginationService } from '../../../../services/pagination.service';
import { PurchaseInvoiceService } from '../../../../services/Inventory/PurchaseInvoice.service';
import { PurchaseInvoiceDto, PurchaseInvoiceLineDto } from '../../../../Models/Inventory/PurchaseInvoice.model';

@Component({
  selector: 'app-purchase-invoice-add-updae',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './purchase-invoice-add-updae.component.html',
  styleUrl: './purchase-invoice-add-updae.component.css',
})
export class PurchaseInvoiceAddUpdaeComponent {
  suppliers = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);

  private piService = inject(PurchaseInvoiceService);
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

  piModel = signal<PurchaseInvoiceDto>(this.piService.createDefaultPI());

  // Direct GRN search autocomplete (no source module)
  grnSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/GRNListApproved');
  selectedGrnId = signal<string | null>(null);

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
    return this.piModel().lines.map(line => {
      const qty = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
      const gross = qty * rate;
      const disc = (line.discountPercentage != null && !isNaN(Number(line.discountPercentage))) ? Number(line.discountPercentage) : 0;
      return gross > 0 ? Number(((gross * disc) / 100).toFixed(2)) : 0;
    });
  });

  // Computed GrandTotal including discount and tax
  grandTotal = computed(() => {
    const taxes = this.taxMap();

    const total = this.piModel().lines.reduce((acc, line) => {
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
          this.loadPurchaseInvoice(id);
        }
      });
  }

  piForm = form(this.piModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.supplierId, { message: 'Supplier is required' });
    required(schema.dateUI, { message: 'Date is required' });

    applyEach(schema.lines, (line) => {
      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();
        if (qty == null || qty <= 0) {
          return { kind: 'positiveQuantity', message: 'Quantity must be greater than 0' };
        }
        const available = valueOf(line.availableQuantity);
        if (available != null && available > 0 && qty > available) {
          return { kind: 'availableExceeded', message: `Quantity cannot exceed GRN quantity (${available})` };
        }
        return null;
      });
    });
  });

  updateField<K extends keyof PurchaseInvoiceDto>(field: K, value: PurchaseInvoiceDto[K]) {
    this.piModel.update(prev => this.piService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof PurchaseInvoiceLineDto>(
    index: number,
    field: K,
    value: PurchaseInvoiceLineDto[K]
  ) {
    this.piModel.update(prev => this.piService.updateLineField(prev, index, field, value));
  }

  deleteLine(lineIndex: number): void {
    this.piModel.update(prev => this.piService.deleteLine(prev, lineIndex));
  }

  searchGRN(event: { query: string }) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      this.grnSearch.searchterm.set(search);
    }
  }

  loadGRNLines(grnId: string): void {
    if (!grnId) return;

    this.piService.getGRNLines(grnId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lines) => {
          if (!lines || lines.length === 0) return;

          const incomingSupplierId = lines.find(l => !!l.supplierId)?.supplierId;
          const currentSupplierId = this.piModel().supplierId;

          if (incomingSupplierId) {
            if (currentSupplierId && currentSupplierId !== incomingSupplierId) {
              this.errors.set(['The selected source document belongs to a different supplier than the currently selected supplier.']);
              this.selectedGrnId.set(null);
              return;
            }

            if (!currentSupplierId) {
              this.updateField('supplierId', incomingSupplierId);
            }
          }

          const existingIds = new Set(
            this.piModel().lines.map(l => l.grnLineId).filter((id): id is string => !!id)
          );
          const newLines = lines.filter(l => !l.grnLineId || !existingIds.has(l.grnLineId));

          if (lines.length > 0 && newLines.length === 0) {
            this.errors.set(['The selected GRN has already been added.']);
            this.selectedGrnId.set(null);
            return;
          }

          this.errors.set([]);

          this.piModel.update(prev => ({
            ...prev,
            lines: [
              ...prev.lines,
              ...newLines.map(l => ({
                ...l,
                quantity: (l.quantity != null && l.quantity > 0) ? l.quantity : (l.availableQuantity ?? 0),
                discountPercentage: l.discountPercentage != null && !isNaN(Number(l.discountPercentage))
                  ? Number(Number(l.discountPercentage).toFixed(2))
                  : 0
              }))
            ]
          }));
          this.selectedGrnId.set(null);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message, false);
        }
      });
  }

  loadFormLookups(): void {
    this.piService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.suppliers.set(res?.suppliers ?? []);
          this.taxes.set(res?.taxes ?? []);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadPurchaseInvoice(id: string): void {
    this.piService.getPIById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          data.dateUI = data.date ? new Date(data.date) : null;
          data.dueDateUI = data.dueDate ? new Date(data.dueDate) : null;
          this.piModel.set(data);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Inventory', 'purchaseinvoicelist']);
        }
      });
  }

  createPurchaseInvoice(event: Event): void {
    if (this.submit()) return;

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.piForm().invalid()) {
      this.piForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.piForm().value() as PurchaseInvoiceDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }

    this.piService.savePI(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Inventory', 'purchaseinvoicelist']);
            this.base.globalMessage('success', 'Purchase Invoice Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Purchase Invoice Added Successfully', false);
          this.piModel.set(this.piService.createDefaultPI());
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
