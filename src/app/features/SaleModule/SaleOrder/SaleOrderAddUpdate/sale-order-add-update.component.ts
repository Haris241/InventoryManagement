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
import { PaginationService } from '../../../../services/pagination.service';
import { ProductVariantSearchDto } from '../../../../Models/Inventory/ProductSearch.model';
import { ProductSearchService } from '../../../../services/Inventory/ProductSearch.service';
import { SaleOrderService } from '../../../../services/Sale/SaleOrder.service';
import { SaleOrderDto, SaleOrderLineDto } from '../../../../Models/Sale/SaleOrder.model';
import { validateDecimalPlaces } from '../../../../shared/validators/decimal.validator';

@Component({
  selector: 'app-sale-order-add-update',
  imports: [RouterLink, FloatLabel, FieldErrorSComponent, FormsModule, InputTextModule, DatePickerModule, SelectModule, FormField, AutoCompleteModule],
  templateUrl: './sale-order-add-update.component.html',
  styleUrl: './sale-order-add-update.component.css',
})
export class SaleOrderAddUpdateComponent {
  wareHouses = signal<AutoDropdown[]>([]);
  taxes = signal<TaxDropDown[]>([]);
  enableBarcode = signal<boolean>(false);
  enableLocation = signal<boolean>(false);
  enableNegativeStock = signal<boolean>(false);
  isTaxExempt = signal<boolean>(false);
  creditDays = signal<number | null>(null);
  creditLimit = signal<number | null>(null);
  isCreditAllowed = signal<boolean>(false);
  selectedCustomer = signal<AutoDropdown | null>(null);


  private soService = inject(SaleOrderService);
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

  soModel = signal<SaleOrderDto>(this.soService.createDefaultSO());
  //for Global Search
  productSearch = this.pagination.autoSearchDropdown<ProductVariantSearchDto>('DropDowns/ProductsVariants');
  productSearchList = this.productSearch.result;
  //Customer Global Search
  CustomerSearch = this.pagination.autoSearchDropdown<AutoDropdown>('SalesDropDown/CustomersList');
  CustomerSearchList = this.CustomerSearch.result;


  private taxMap = computed(() => {
    const map = new Map<string | number, number>();

    for (const tax of this.taxes()) {
      if (tax.id != null) {
        map.set(tax.id, tax.rate);
      }
    }

    return map;
  });

  activeDiscountAmount = signal<{ index: number; value: number | null } | null>(null);

  // Computed discount amounts per line
  lineDiscountAmounts = computed(() => {
    return this.soModel().lines.map((line, i) => {
      const active = this.activeDiscountAmount();
      if (active && active.index === i) {
        return active.value != null && !isNaN(Number(active.value)) ? Number(active.value) : 0;
      }
      const qty = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
      const gross = qty * rate;
      const disc = (line.discountPercentage != null && !isNaN(Number(line.discountPercentage))) ? Number(line.discountPercentage) : 0;
      return gross > 0 ? Number(((gross * disc) / 100).toFixed(2)) : 0;
    });
  });

  // 2. Computed GrandTotal using the safe lookup
  grandTotal = computed(() => {
    const taxes = this.taxMap();
    const taxExempt = this.isTaxExempt();

    const total = this.soModel().lines.reduce((total, line) => {
      const quantity = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
      const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
      const discountPercentage = (line.discountPercentage != null && !isNaN(Number(line.discountPercentage))) ? Number(line.discountPercentage) : 0;

      const discountAmount = (quantity * rate) * (discountPercentage / 100);
      const taxableAmount = (quantity * rate) - discountAmount;

      // Tax-exempt customers pay no tax, matching the backend
      const taxRate = taxExempt || line.taxId == null ? 0 : (taxes.get(line.taxId) ?? 0);
      const taxAmount = taxableAmount * (taxRate / 100);

      return total + taxableAmount + taxAmount;
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
          this.loadSO(id);
        }
      });
  }

  soForm = form(this.soModel, (schema) => {
    required(schema.name, { message: 'Name is required', });
    required(schema.customerId, { message: 'Customer is required', });
    required(schema.orderDateUI, { message: 'Date is required', });

    applyEach(schema.lines, (line) => {
      required(line.wareHouseId, { message: 'Warehouse is required', });
      required(line.productVariantId, { message: 'Product is required', });
      validate(line.rate, ({ value }) => {
        const rate = value();
        if (rate == null || rate <= 0) {
          return { kind: 'positiveQuantity', message: 'Rate must be greater than 0' };
        }
        return validateDecimalPlaces(rate);
      });
      validate(line.discountPercentage, ({ value }) => {
        const discountPercentage = value();
        if (discountPercentage == null || discountPercentage < 0) {
          return { kind: 'minDiscount', message: 'Discount must be greater than or equal to 0' };
        }
        if (discountPercentage > 100) {
          return { kind: 'maxDiscount', message: 'Discount cannot be above 100%' };
        }
        return validateDecimalPlaces(discountPercentage);
      });
      validate(line.quantity, ({ value, valueOf }) => {
        const qty = value();

        if (qty == null || qty < 0) {
          return { kind: 'positiveQuantity', message: 'Quantity must be greater than or equal to 0' };
        }

        if (!this.enableNegativeStock()) {
          const available = valueOf(line.availableQuantity) ?? 0;
          if (qty > available) {
            return { kind: 'quantityExceeded', message: 'Quantity cannot be greater than Available quantity.' };
          }
        }

        return validateDecimalPlaces(qty);
      });

    });
  });

  updateField<K extends keyof SaleOrderDto>(field: K, value: SaleOrderDto[K]) {
    this.soModel.update(prev => this.soService.updateField(prev, field, value));
  }

  updateLineField<K extends keyof SaleOrderLineDto>(
    index: number,
    field: K,
    value: SaleOrderLineDto[K]
  ) {
    this.soModel.update(prev => this.soService.updateLineField(prev, index, field, value));
  }

  onDiscountAmountChange(index: number, amount: number | null): void {
    this.activeDiscountAmount.set({ index, value: amount });
    const amt = (amount != null && !isNaN(Number(amount))) ? Number(amount) : 0;
    const line = this.soModel().lines[index];
    const qty = (line.quantity != null && !isNaN(Number(line.quantity))) ? Number(line.quantity) : 0;
    const rate = (line.rate != null && !isNaN(Number(line.rate))) ? Number(line.rate) : 0;
    const gross = qty * rate;
    if (gross > 0) {
      const percentage = Number(((amt / gross) * 100).toFixed(2));
      this.updateLineField(index, 'discountPercentage', percentage);
    } else {
      this.updateLineField(index, 'discountPercentage', 0);
    }
  }

  onDiscountAmountBlur(): void {
    this.activeDiscountAmount.set(null);
  }

  addLine(): void {
    const index = this.soModel().lines.length - 1;
    const line = this.soForm.lines[index];

    //Mark required field 
    const isInvalid = line.wareHouseId().invalid() || line.productVariantId().invalid() || line.quantity().invalid()
      || line.discountPercentage().invalid() || line.rate().invalid();

    if (isInvalid) {
      // only mark THIS line
      line.wareHouseId().markAsTouched();
      line.productVariantId().markAsTouched();
      line.quantity().markAsTouched();
      line.discountPercentage().markAsTouched();
      line.rate().markAsTouched();

      return;
    }

    this.soModel.update(prev => ({
      ...prev,
      lines: [...prev.lines, this.soService.createDefaultSOline(prev.lines)]
    }));
  }

  deleteLine(lineIndex: number): void {
    this.soModel.update(prev => this.soService.deleteLine(prev, lineIndex));
  }

  createSO(event: Event) {
    if (this.submit()) {
      return;
    }

    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);

    if (this.soForm().invalid()) {
      this.soForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.soForm().value() as SaleOrderDto;
    if (formvalue.lines.length === 0) {
      this.errors.set(['Please add at least one line']);
      this.submit.set(false);
      return;
    }


    this.soService.saveSO(formvalue, this.isEditMode())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.isEditMode()) {
            this.router.navigate(['Sales', 'saleorderlist']);
            this.base.globalMessage('success', 'Sale Order Updated Successfully', false);
            return;
          }

          this.base.globalMessage('success', 'Sale Order Added Successfully', false);
          this.soModel.set(this.soService.createDefaultSO());

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
    this.soService.getFormLookups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.wareHouses.set(res.warehouses);
          this.taxes.set(res.taxes);
          this.enableBarcode.set(res.enableBarcode);
          this.enableLocation.set(res.enableLocations);
          this.enableNegativeStock.set(res.enableNegativeStock);
        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  loadSO(id: string) {
    this.soService.getSOById(id)
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
              cost: 0,
            };
          });

          this.productSearch.setInitialValue(
            data.lines.map(x => x.selectedProductVariant!)
          );
          if (data.customerId) {
            const customer = { id: data.customerId, name: data.customerName } as AutoDropdown;
            this.selectedCustomer.set(customer);
            this.CustomerSearch.setInitialValue([customer]);
            this.loadCustomerDetails(String(data.customerId), false);
          }
          data.orderDateUI = data.orderDate ? new Date(data.orderDate) : null;
          this.soModel.set(data);

          this.loadLocationsForLines(data.lines);

        },
        error: (err) => {
          this.base.handleError(err, err.error?.message);
          this.router.navigate(['Sales', 'saleorderlist']);
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

    const barcode = this.soModel().lines[index].barcode?.trim();

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
    this.soModel.update(prev => {
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
    const whId = this.soModel().lines[index].wareHouseId;
    const locId = this.soModel().lines[index].warehouseLocationId;
    if (whId && product.id) {
      this.fetchAvailableStock(index, whId, product.id, locId);
    }

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

  loadLocationsForLines(lines: SaleOrderLineDto[]): void {
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
  onCustomerChange(value: AutoDropdown | string | null): void {
    // typing emits a string; only a selected object counts as a customer
    const customer = value && typeof value === 'object' ? value : null;
    this.selectedCustomer.set(customer);
    this.updateField('customerId', (customer?.id ?? null) as any);

    if (!customer) {
      this.resetCustomerDetails();
    }
  }

  onCustomerSelect(customer: AutoDropdown): void {
    this.loadCustomerDetails(String(customer.id), true);
  }
  loadCustomerDetails(customerId: string, applyAddresses: boolean): void {
    this.soService.getCustomerDetails(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          this.creditDays.set(details.creditDays ?? 0);
          this.creditLimit.set(details.creditLimit ?? 0);
          this.isCreditAllowed.set(details.isCreditAllowed);
          this.isTaxExempt.set(details.isTaxExempt);

          if (details.isTaxExempt) {
            this.soModel.update(prev => ({
              ...prev,
              lines: prev.lines.map(l => ({ ...l, taxId: null }))
            }));
          }

          if (applyAddresses) {
            this.updateField('billingAddress', details.billingAddress ?? '');
            this.updateField('shippingAddress', details.shippingAddress ?? '');
          }
        },
        error: (err) => {
          this.resetCustomerDetails();
          this.base.handleError(err, err.error?.message);
        }
      });
  }

  private resetCustomerDetails(): void {
    this.creditDays.set(null);
    this.creditLimit.set(null);
    this.isCreditAllowed.set(false);
    this.isTaxExempt.set(false);
  }

}
