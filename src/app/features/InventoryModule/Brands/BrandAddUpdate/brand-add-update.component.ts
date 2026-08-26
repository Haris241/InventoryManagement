import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../../services/data-layer.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { BrandDto } from '../../../../Models/Inventory/Brand.model';
import { FormDataService } from '../../../../services/formData.service';

@Component({
  selector: 'app-brand-add-update',
  imports: [FloatLabelModule, FieldErrorSComponent, FormsModule, InputTextModule, FormField],
  templateUrl: './brand-add-update.component.html',
  styleUrl: './brand-add-update.component.css',
})
export class BrandAddUpdateComponent {
  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private formservice = inject(FormDataService);


  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  isEditMode = signal<boolean>(false);
  imagePreview = signal<string>('');
  selectedImage: File | null = null;


  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadBrand(id);
        }
      });
  }

  //Intialize Main Object
  private readonly initialBrandModel: BrandDto = {
    name: '',
    description: '',
    slug: '',
    isActive: true,
    logoUrlString: ''
  };

  //Intialize Main Object with Signal
  brandModel = signal<BrandDto>(this.initialBrandModel);

  //validations
  brandForm = form(this.brandModel, (schema) => {
    // Root validations
    required(schema.name, { message: 'Name is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof BrandDto>(field: K, value: BrandDto[K]) {
    this.brandModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Create method
  createBrand(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.brandForm().invalid()) {
      this.brandForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.brandForm().value() as BrandDto;
    //handle image
    if (this.selectedImage) {
      formvalue.logoUrl = this.selectedImage;
    }
    const formdata = this.formservice.buildFormData(formvalue);

    //for update and create
    const url = `Brands`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<BrandDto>(url, formvalue.id?.toString() ?? '', formdata)
      : this.dataService.create<BrandDto>(url, formdata);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'brandslist']);
          this.base.globalMessage('success', 'Brand Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Brand Added Successfully', false);
        //Reset the form
        this.brandForm().reset({ ...this.initialBrandModel });
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


  loadBrand(id: string) {
    this.dataService.getById<BrandDto>('Brands', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.brandModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'brandslist']);
      }
    });
  }
  onImageSelected(event: Event) {
    this.selectedImage = this.formservice.onImageSelected(event, this.imagePreview);
  }

  removeImage() {
    this.selectedImage = this.formservice.removeImage(this.imagePreview, 'clientLogo');
  }


}
