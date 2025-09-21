import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { BaseApiService } from '../../../services/base-api.service';
import { Supplier } from '../../../Models/Supplier.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-supplier',
  imports: [InputTextModule, ReactiveFormsModule, ToastModule],
  templateUrl: './add-supplier.component.html',
  styleUrl: './add-supplier.component.css'
})
export class AddSupplierComponent {
  constructor(private api: BaseApiService ){}
  fb = inject(FormBuilder);
  private message = inject(MessageService)

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
        this.message.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Suplier Added Successfully',
        });
      this.submit=false;
      this.addSupplier.reset();
      },
      error:(err)=>{
          this.api.handleError(err,err.error.message);
          this.submit=false;
      }
    });

  }
}
