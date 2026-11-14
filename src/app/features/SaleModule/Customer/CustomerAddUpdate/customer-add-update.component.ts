import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { email, form, FormField, readonly, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CustomerDto, CustomerType } from '../../../../Models/Sale/Customer.model';
import { enumToOptions } from '../../../../shared/Utility';

@Component({
  selector: 'app-customer-add-update',
  imports: [AutoCompleteModule, FieldErrorSComponent, FormField, FormsModule, FloatLabel, InputTextModule, SelectModule],
  templateUrl: './customer-add-update.component.html',
  styleUrl: './customer-add-update.component.css',
})
export class CustomerAddUpdateComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  coaCustomerList = signal<AutoDropdown[]>([]);
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  customerTypes = signal(enumToOptions(CustomerType, true));


  ngOnInit() {
    this.GetChartOfAccounts();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadCustomer(id);
        }
      });
  }
  //Get DropDown List
  GetChartOfAccounts() {
    this.dataService.getAllSimple<AutoDropdown>('AccountsDropDown/COACustomerList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.coaCustomerList.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  private readonly initialModel: CustomerDto = {
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    customerType: CustomerType.Individual,
    ntn: '',
    strn: '',
    billingAddress: '',
    billingCity: '',
    billingCountry: '',
    isCreditAllowed: true,
    creditDays: 0,
    creditLimit: 0,
    isTaxExempt: false,
    shippingAddress: '',
    shippingCity: '',
    shippingCountry: '',
    website: '',
    isActive: true,
    chartOfAccountId: null,
    chartOfAccountName: '',
  };

  //Signal Model For FormData
  customerModel = signal<CustomerDto>({ ...this.initialModel });

  // Drives readonly state of credit fields
  isCreditAllowed = computed(() => this.customerModel().isCreditAllowed);

  // Reset credit fields when credit is turned off
  private readonly creditResetEffect = effect(() => {
    if (!this.isCreditAllowed()) {
      this.customerModel.update(m =>
        m.creditLimit === 0 && m.creditDays === 0 ? m : { ...m, creditLimit: 0, creditDays: 0 });
    }
  });

  // Signal form with validation schema
  customerForm = form(this.customerModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.code, { message: 'Code is required' });
    required(schema.customerType, { message: 'Customer Type is required' });
    required(schema.chartOfAccountId, { message: 'Chart Of Account is required' });
    email(schema.email, { message: 'Invalid email address' });

    validate(schema.creditLimit, ({ value, valueOf }) => {
      const limit = value();
      if (limit == null) {
        return { kind: 'requiredCreditLimit', message: 'Credit Limit is required' };
      }
      if (limit < 0) {
        return { kind: 'negativeCreditLimit', message: 'Credit Limit cannot be negative' };
      }
      if (valueOf(schema.isCreditAllowed) && limit <= 0) {
        return { kind: 'positiveCreditLimit', message: 'Credit Limit must be greater than 0 when credit is allowed' };
      }
      return null;
    });

    validate(schema.creditDays, ({ value }) => {
      const days = value();
      if (days == null) {
        return { kind: 'requiredCreditDays', message: 'Credit Days is required' };
      }
      if (days < 0) {
        return { kind: 'negativeCreditDays', message: 'Credit Days cannot be negative' };
      }
      if (!Number.isInteger(days)) {
        return { kind: 'integerCreditDays', message: 'Credit Days must be a whole number' };
      }
      return null;
    });

    // Readonly when credit is not allowed
    readonly(schema.creditLimit, () => !this.isCreditAllowed());
    readonly(schema.creditDays, () => !this.isCreditAllowed());
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CustomerDto>(field: K, value: CustomerDto[K]) {
    this.customerModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Customer
  createCustomer(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.customerForm().invalid()) {
      this.customerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.customerForm().value() as CustomerDto;

    //for update and create
    const url = `Customer`;
    const request$ = this.isEditMode() ?
      this.dataService.edit<CustomerDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.create<CustomerDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Sales', 'customerlist']);
          this.base.globalMessage('success', 'Customer Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Customer Added Successfully', false);

        this.customerForm().reset({ ...this.initialModel });
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

  loadCustomer(id: string) {
    this.dataService.getById<CustomerDto>('Customer', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.customerModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Sales', 'customerlist']);
      }
    });
  }

}
