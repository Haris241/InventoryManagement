import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BaseApiService } from '../../../services/base-api.service';
import { Supplier } from '../../../Models/Supplier.model';
import { Product } from '../../../Models/product.model';


@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, CommonModule,ToastModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  constructor(private api: BaseApiService) { }
  private fb = inject(FormBuilder);
  private message = inject(MessageService)
  submit = false;
  suppliers: Supplier[] = [];
  msg: any[] = [];

  ngOnInit() {
    this.api.getAll<Supplier>("Supplier").subscribe({
      next:(data: Supplier[])=>{
        this.suppliers= data;
      },
      error:(err)=>{
        this.api.handleError(err,err.error.message);
      }
    });
  }

  addproduct: FormGroup = this.fb.group({
    name: ['', Validators.required],
    price: [null, Validators.required],
    quantity: [null],
    supplierId: [null]
  });

  createProduct() {
    this.submit = true;
    if (this.addproduct.invalid) {
      this.addproduct.markAllAsTouched();
      return;
    }
    const newproduct: Omit<Product, 'id'> = this.addproduct.value;
    this.api.create<Omit<Product, 'id'>>("Products", newproduct).subscribe({
      next: () => {
        
        this.message.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Product Added Successfully',
        });
        this.addproduct.reset();
        this.submit = false;
      },
      error: (err) => {
        this.api.handleError(err,err.error.message);
        this.submit = false;
      }
    });
  }

}
