import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProductAttributeValueDto } from '../../../../Models/Inventory/AttributeValue.model';
import { DepartmentDto } from '../../../../Models/Inventory/Department.model';

@Component({
  selector: 'app-add-update-department',
  imports: [AutoCompleteModule, FieldErrorSComponent, FormField, FormsModule, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './add-update-department.component.html',
  styleUrl: './add-update-department.component.css',
})
export class AddUpdateDepartmentComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadDepartment(id);
        }
      });
  }



  private readonly initialModel: DepartmentDto = {
    name: '',
    code: '',
    description: '',
    isActive: true,
  };

  //Signal Model For FormData
  departmentModel = signal<DepartmentDto>({ ...this.initialModel });


  // Signal form with validation schema
  departmentForm = form(this.departmentModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.code, { message: 'Code is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductAttributeValueDto>(field: K, value: ProductAttributeValueDto[K]) {
    this.departmentModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Department
  createDepartment(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.departmentForm().invalid()) {
      this.departmentForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.departmentForm().value() as DepartmentDto;

    //for update and create
    const url = `Department`;
    const request$ = this.isEditMode() ?
      this.dataService.edit<DepartmentDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.create<DepartmentDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'departmentslist']);
          this.base.globalMessage('success', 'Department Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Department Added Successfully', false);

        this.departmentForm().reset({ ...this.initialModel });
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

  loadDepartment(id: string) {
    this.dataService.getById<DepartmentDto>('Department', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.departmentModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'departmentslist']);
      }
    });
  }

}
