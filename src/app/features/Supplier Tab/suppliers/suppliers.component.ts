import { Component,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { BaseApiService } from '../../../services/base-api.service';
import { Supplier } from '../../../Models/Supplier.model';

@Component({
  selector: 'app-suppliers',
  imports: [TableModule,RouterLink, ToastModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SuppliersComponent {
  constructor(private api: BaseApiService){}
  suppliers: Supplier[]=[];

  ngOnInit(){
    this.api.getAll<Supplier>("Supplier").subscribe({
      next:(data:Supplier[])=>{
        this.suppliers=data;
      },
      error:(err)=>{
        this.api.handleError(err,err.error.message);
      }
    });
  }
}
