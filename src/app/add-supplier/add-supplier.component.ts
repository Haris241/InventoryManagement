import { Component, inject } from '@angular/core';
import { BaseApiService } from '../services/base-api.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Supplier } from '../Models/Supplier.model';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-add-supplier',
  imports: [InputTextModule, ReactiveFormsModule, MessagesModule],
  templateUrl: './add-supplier.component.html',
  styleUrl: './add-supplier.component.css'
})
export class AddSupplierComponent {
  constructor(private api: BaseApiService ){}
  fb = inject(FormBuilder);

  msg: MessagesModule[]=[];
  submit = false;
  addSupplier: FormGroup = this.fb.group({
    name: ['',Validators.required],
    contact: [null]
  });

  createSupplier(){
    this.submit=true;
    if(this.addSupplier.invalid){
      return this.addSupplier.markAllAsTouched();
    }
    const createSupplier: Omit<Supplier,'id'> = this.addSupplier.value;
    this.api.create<Omit<Supplier,'id'>>("Supplier",createSupplier).subscribe({
      next:()=>{
        this.msg=[{
          severity: "success",
          detail: "Supplier added Succesfully",
          life: "3000"
      }];
      this.submit=false;
      this.addSupplier.reset();
      },
      error:()=>{
        this.msg=[{
          severity: "error",
          detail: "There is error in adding supplier",
          life: "3000"
        }];
      }
    });

  }
}
