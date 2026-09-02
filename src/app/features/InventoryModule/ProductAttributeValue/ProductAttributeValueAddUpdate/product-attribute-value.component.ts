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
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProductAttributeValueDto } from '../../../../Models/Inventory/AttributeValue.model';

@Component({
  selector: 'app-product-attribute-value',
  imports: [AutoCompleteModule, FieldErrorSComponent, FormField, FormsModule, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './product-attribute-value.component.html',
  styleUrl: './product-attribute-value.component.css',
})
export class ProductAttributeValueComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  attributeDefinitionList = signal<AutoDropdown[]>([]);
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  ngOnInit() {
    this.GetDropDownList();
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadProductAttribute(id);
        }
      });
  }
  //Get DropDown List
  GetDropDownList() {
    this.dataService.getAllSimple<AutoDropdown>('DropDowns/AttributeDefinitionList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.attributeDefinitionList.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  private readonly initialModel: ProductAttributeValueDto = {
    attributeDefinitionId: null,
    value: '',
    code: '',
    isActive: true,
  };

  //Signal Model For FormData
  productAttributeValueModel = signal<ProductAttributeValueDto>({ ...this.initialModel });


  // Signal form with validation schema
  productAttributeValueForm = form(this.productAttributeValueModel, (schemaPath) => {
    required(schemaPath.value, { message: 'Value is required' });
    required(schemaPath.code, { message: 'Code is required' });
    required(schemaPath.attributeDefinitionId, { message: 'Attribute Definition is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductAttributeValueDto>(field: K, value: ProductAttributeValueDto[K]) {
    this.productAttributeValueModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Product Attribute Value
  createProductAttributeValue(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.productAttributeValueForm().invalid()) {
      this.productAttributeValueForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.productAttributeValueForm().value() as ProductAttributeValueDto;

    //for update and create
    const url = `ProductAttributeValue`;
    const request$ = this.isEditMode() ?
      this.dataService.edit<ProductAttributeValueDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.create<ProductAttributeValueDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'productattributelist']);
          this.base.globalMessage('success', 'Product Attribute Value Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Product Attribute Value Added Successfully', false);

        this.productAttributeValueForm().reset({ ...this.productAttributeValueModel(), value: '', code: '' });
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

  loadProductAttribute(id: string) {
    this.dataService.getById<ProductAttributeValueDto>('ProductAttributeValue', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.productAttributeValueModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'productattributelist']);
      }
    });
  }

}
