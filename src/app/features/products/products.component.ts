import { Component } from '@angular/core';
import { Product } from '../../Models/product.model';
import { BaseApiService } from '../../services/base-api.service';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';

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
  this.api.getAll<Product>("Products").subscribe((data: Product[])=>{
    console.log("Products: ",data);
    this.products=data;
  });
}

}
