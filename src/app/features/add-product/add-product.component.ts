import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { BaseApiService } from '../../services/base-api.service';
import { Product } from '../../Models/product.model';
import { Supplier } from '../../Models/Supplier.model';
import { SelectModule } from 'primeng/select';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-add-product',
  imports: [ReactiveFormsModule, InputTextModule, MessagesModule, SelectModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {
  constructor(private messageservice: MessageService,
    private api: BaseApiService) { }
  private fb = inject(FormBuilder);
  submit = false;
  suppliers: Supplier[] = [];
  msg: MessagesModule[] = [];

  ngOnInit() {
    this.api.getAll<Supplier>("Supplier").subscribe((data: Supplier[]) => {
      this.suppliers = data;
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
        this.msg = [{
          severity: "success",
          detail: "Product added Succesfully",
          life: "3000"
        }];
        this.addproduct.reset();
        this.submit = false;
      },
      error: () => {
        this.msg = [{
          severity: "error",
          detail: "There is error in adding supplier",
          life: "3000"
        }];
        this.submit = false;
      }
    });
  }

}
