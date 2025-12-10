import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { BaseApiService } from '../../../services/base-api.service';
import { Product, ProductList } from '../../../Models/product.model';
import { ActivatedRoute } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginationService } from '../../../services/pagination.service';
import { AutoDropdown } from '../../../Models/Pagination.model';
import { FieldErrorComponent } from "../../../shared/field-error/field-error.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, CommonModule, ToastModule, AutoCompleteModule, FieldErrorComponent],
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
  private api = inject(BaseApiService);
  private pagination = inject(PaginationService);
  private activatedRoute = inject(ActivatedRoute);
  submit = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  suppliersearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/Suppliers');
  suppliers = this.suppliersearch.result;
  backendErrors = signal<Record<string, string[]>>({});
  formChange = signal<number>(0);

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(param => {
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
    price: [null,[Validators.required,Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    quantity: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
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
    const formValue = this.addproduct.value;
    if (formValue.quantity == null || formValue.quantity === '') {
      formValue.quantity = 0;
    }
    if (!this.isEditMode()) {
      delete formValue.id;
      console.log("Form Value:", formValue);
      this.api.create<Product>('Products', formValue).subscribe({
        next: () => {
          this.api.globalMessage('success', 'Product Added Successfully');
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
            this.api.handleError(err, err.error.message);
            this.submit.set(false);
          }
        }
      });
    } else {
      const id = this.addproduct.get('id')?.value;
      this.api.edit<Product>('Products', id, formValue).subscribe({
        next: () => {

          this.api.globalMessage('success', 'Product Updated Successfully');
          this.addproduct.reset();
          this.submit.set(false);
        },
        error: (err) => {
          this.api.handleError(err, err.error.message);
          this.submit.set(false);
        }
      });
    }

  }

  loadProduct(id: string) {
    this.api.getById<ProductList>('Products', id).subscribe({
      next: (data: ProductList) => {
        console.log("data: ", data);

        if (data.supplierId && data.supplierName) {
          this.suppliersearch.setInitialValue([{
            id: data.supplierId,
            name: data.supplierName
          }]);
        }
        queueMicrotask(() => this.addproduct.patchValue(data));

      },
      error: (err) => {
        this.api.handleError(err, err.error?.message);
      }
    });
  }

  SearchSuppliers(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

}
