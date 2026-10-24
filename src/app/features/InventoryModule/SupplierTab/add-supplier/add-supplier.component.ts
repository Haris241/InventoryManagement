import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SupplierDto } from '../../../../Models/Inventory/Supplier.model';

@Component({
  selector: 'app-add-supplier',
  imports: [AutoCompleteModule, FieldErrorSComponent, FormField, FormsModule, FloatLabel, InputTextModule, SelectModule],
  templateUrl: './add-supplier.component.html',
  styleUrl: './add-supplier.component.css'
})
export class AddSupplierComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  coaSupplierList = signal<AutoDropdown[]>([]);
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  ngOnInit() {
    this.GetChartOfAccounts();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadSupplier(id);
        }
      });
  }
  //Get DropDown List
  GetChartOfAccounts() {
    this.dataService.getAllSimple<AutoDropdown>('AccountsDropDown/COASupplierList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.coaSupplierList.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  private readonly initialModel: SupplierDto = {
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    isActive: true,
    chartOfAccountId: null,
    chartOfAccountName: '',
  };

  //Signal Model For FormData
  supplierModel = signal<SupplierDto>({ ...this.initialModel });


  // Signal form with validation schema
  supplierForm = form(this.supplierModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.code, { message: 'Code is required' });
    required(schemaPath.chartOfAccountId, { message: 'Chart Of Account is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof SupplierDto>(field: K, value: SupplierDto[K]) {
    this.supplierModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Supplier
  createSupplier(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.supplierForm().invalid()) {
      this.supplierForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.supplierForm().value() as SupplierDto;

    //for update and create
    const url = `Supplier`;
    const request$ = this.isEditMode() ?
      this.dataService.edit<SupplierDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.create<SupplierDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'supplierlist']);
          this.base.globalMessage('success', 'Supplier Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Supplier Added Successfully', false);

        this.supplierForm().reset({ ...this.initialModel });
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

  loadSupplier(id: string) {
    this.dataService.getById<SupplierDto>('Supplier', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.supplierModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'supplierlist']);
      }
    });
  }

}
