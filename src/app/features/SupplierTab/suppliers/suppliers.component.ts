import { Component,CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { BaseApiService } from '../../../services/base-api.service';
import { Supplier } from '../../../Models/Supplier.model';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-suppliers',
  imports: [TableModule,RouterLink, ToastModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SuppliersComponent {
  constructor(private api: BaseApiService){}
  confimation = inject(ConfirmationService);
  msg = inject(MessageService);
  suppliers=signal<Supplier[]>([]);

  ngOnInit(){
    this.api.getAll<Supplier>("Supplier").subscribe({
      next:(data:Supplier[])=>{
        this.suppliers.set(data);
      },
      error:(err)=>{
        this.api.handleError(err,err.error.message);
      }
    });
  }
  deleteSupplier(id: string){
    this.confimation.confirm({
      message: 'Are you sure you want to delete this Supplier?',
      header: 'Supplier Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept:()=>{
        this.api.delete<void>('Supplier',id).subscribe({
          next:()=>{
            this.suppliers.update(supplier=>supplier.filter(s=>s.id!==id));
            this.msg.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Supplier Deleted Successfully'
            });
          },
          error:(err)=>{
            this.api.handleError(err)
          }
        });
      },
      reject: ()=>{

      }
    });
  }
}
