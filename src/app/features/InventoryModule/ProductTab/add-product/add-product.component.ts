import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';

import { ToastModule } from 'primeng/toast';
import { ActivatedRoute } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { FormDataService } from '../../../../services/formData.service';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { ProductCreate, ProductList } from '../../../../Models/product.model';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, InputTextModule, FloatLabelModule, SelectModule, ToastModule, AutoCompleteModule, FieldErrorComponent],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  constructor() {
    this.addproduct.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.formChange.update(v => v + 1);
      });
  }
  private fb = inject(FormBuilder);
  private base = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private activatedRoute = inject(ActivatedRoute);
  private formservice = inject(FormDataService);
  private destroyRef= inject(DestroyRef);
  private dataService = inject(DataLayerService);

  submit = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  suppliersearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/Suppliers');
  suppliers = this.suppliersearch.result;
  backendErrors = signal<Record<string, string[]>>({});
  formChange = signal<number>(0);
  selectedImage: File | null = null;
  imagePreview = signal<string>('');

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
    takeUntilDestroyed(this.destroyRef)).subscribe(param => {
      const id = param.get('id');
      if (id) {
        
        this.isEditMode.set(true);
        this.loadProduct(id);
      }
    });
  }

  addproduct: FormGroup = this.fb.group({
    id: [null],
    name: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(0)]],
    quantity: [null, [Validators.min(0)]],
    supplierId: [null]
  });

  createProduct() {
    this.submit.set(true);
    if (this.addproduct.invalid) {
      this.addproduct.markAllAsTouched();
      this.submit.set(false);
      return;
    }
    this.backendErrors.set({});
    const formValue = this.addproduct.value as ProductCreate;
    if (!this.isEditMode()) {
      delete formValue.id;
      if (this.selectedImage) {
        formValue.productImage = this.selectedImage;
      }
       const formdata = this.formservice.buildFormData(formValue);
      this.dataService.create<ProductCreate>('Products', formdata).subscribe({
        next: () => {
          this.base.globalMessage('success', 'Product Added Successfully');
          this.addproduct.patchValue({
            name: '',
            quantity: 0
          });
          this.submit.set(false);
        },
        error: (err) => {
          if (err.error.errors) {
            this.backendErrors.set(err.error.errors);
            this.submit.set(false);
          } else {
            this.base.handleError(err, err.error.message);
            this.submit.set(false);
          }
        }
      });
    } else {
      const id = this.addproduct.get('id')?.value;
      if (this.selectedImage) {
        formValue.productImage = this.selectedImage;
      }
       const formdata = this.formservice.buildFormData(formValue);
      this.dataService.edit<ProductCreate>('Products', id, formdata).subscribe({
        next: () => {

          this.base.globalMessage('success', 'Product Updated Successfully');
          this.addproduct.reset();
          this.submit.set(false);
        },
        error: (err) => {
          this.base.handleError(err, err.error.message);
          this.submit.set(false);
        }
      });
    }

  }

  loadProduct(id: string) {
    this.dataService.getById<ProductList>('Products', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: ProductList) => {
        console.log("data: ", data);

        if (data.supplierId && data.supplierName) {
          this.suppliersearch.setInitialValue([{
            id: data.supplierId,
            name: data.supplierName
          }]);
        }
        queueMicrotask(() => this.addproduct.patchValue(data));
        this.imagePreview.set(data.productImageUrl);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  SearchSuppliers(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.selectedImage = null;
      this.imagePreview.set('');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.base.globalMessage('error', 'Invalid file type. Please select JPEG, PNG or WebP Only');
      this.selectedImage = null;
      input.value = '';
      return;
    }
    const fileSize = 3 * 1024 * 1024
    if (file.size > fileSize) {
      this.base.globalMessage('error', 'File Must be Less than 3 MB.');
      this.selectedImage = null;
      input.value = '';
      return;
    }

    this.selectedImage = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.imagePreview.set(e.target?.result as string) };
    reader.readAsDataURL(file);

  }
}
