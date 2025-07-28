import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Supplier } from '../../Models/Supplier.model';
import { BaseIconClasses } from 'primeng/icons/baseicon';
import { BaseApiService } from '../../services/base-api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-suppliers',
  imports: [TableModule,RouterLink],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  constructor(private api: BaseApiService){}
  suppliers: Supplier[]=[];

  ngOnInit(){
    this.api.getAll<Supplier>("Supplier").subscribe((data: Supplier[])=>{
      this.suppliers=data;
    });
  }
}
