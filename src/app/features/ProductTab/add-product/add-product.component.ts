import { Component, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BaseApiService } from '../../../services/base-api.service';
import { Supplier } from '../../../Models/Supplier.model';
import { Product } from '../../../Models/product.model';
import { ActivatedRoute } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
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
  submit = false;
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
    price: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    quantity: [0, [Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    supplierId: [null]
  });

  createProduct() {
    this.submit = true;
    if (this.addproduct.invalid) {
      this.addproduct.markAllAsTouched();
      return;
    }
    if (!this.isEditMode()) {
      const newproduct: Omit<Product, 'id'> = this.addproduct.value;
      this.api.create<Omit<Product, 'id'>>('Products', newproduct).subscribe({
        next: () => {

          this.message.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product Added Successfully'
          });
          this.addproduct.reset();
          this.submit = false;
        },
        error: (err) => {
          this.api.handleError(err, err.error.message);
          this.submit = false;
        }
      });
    } else {
      const id = this.addproduct.get('id')?.value;
      this.api.edit<Product>('Products', id, this.addproduct.value).subscribe({
        next: () => {

          this.message.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product Updated Successfully'
          });
          this.addproduct.reset();
          this.submit = false;
        },
        error: (err) => {
          this.api.handleError(err, err.error.message);
          this.submit = false;
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
