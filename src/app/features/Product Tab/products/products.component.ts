import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { BaseApiService } from '../../../services/base-api.service';
import { Product } from '../../../Models/product.model';

@Component({
  selector: 'app-products',
  imports: [TableModule,RouterLink, DropdownModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
constructor (private api:BaseApiService){}
products: Product[]=[];
ngOnInit(){
  this.api.getAll<Product>("Products").subscribe({
    next:(data: Product[])=>{
      console.log("Products: ",data);
      this.products=data;
    },
    error:(err)=>{
      this.api.handleError(err,err.error.message);
    }
  });
}

}
