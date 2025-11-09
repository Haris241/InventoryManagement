import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BaseApiService } from '../../../services/base-api.service';
import { Product } from '../../../Models/product.model';
import { ActivatedRoute } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PaginationService } from '../../../services/pagination.service';
import { AutoDropdown } from '../../../Models/Pagination.model';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, CommonModule, ToastModule, AutoCompleteModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  constructor() { }
  private fb = inject(FormBuilder);
  private api = inject(BaseApiService);
  private pagination = inject(PaginationService)
  private message = inject(MessageService);
  private activatedRoute = inject(ActivatedRoute);
  submit = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  suppliersearch=this.pagination.autoSearchDropdown<AutoDropdown>('Supplier/dropdown');
  suppliers = this.suppliersearch.result
  searchFilter = this.suppliersearch.searchterm;
  

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
    name: ['', Validators.required],
    price: [null, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    quantity: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    supplierId: [null]
  });

  createProduct() {
    this.submit.set(true);
    if (this.addproduct.invalid) {
      this.addproduct.markAllAsTouched();
      return;
    }
    const formValue = this.addproduct.value;
  if (formValue.quantity == null || formValue.quantity === '') {
    formValue.quantity = 0;
  }
    if (!this.isEditMode()) {
      this.api.create<Product>('Products', formValue).subscribe({
        next: () => {

          this.message.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product Added Successfully'
          });
          this.addproduct.patchValue({
            name:'',
            quantity:0
          });
          this.submit.set(false);
        },
        error: (err) => {
          this.api.handleError(err, err.error.message);
          this.submit.set(false);
        }
      });
    } else {
      const id = this.addproduct.get('id')?.value;
      this.api.edit<Product>('Products', id, formValue).subscribe({
        next: () => {

          this.message.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product Updated Successfully'
          });
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
    this.api.getById<Product>('Products', id).subscribe({
      next: (data: Product) => {
        console.log("data: ", data);
        this.addproduct.patchValue(data);
        this.addproduct.addControl('id', this.fb.control(data.id));
      },
      error: (err) => {
        this.api.handleError(err, err.error?.message);
      }
    });
  }

  SearchSuppliers(event: { query: string }) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      this.searchFilter.set(search);
    }
  }

}
