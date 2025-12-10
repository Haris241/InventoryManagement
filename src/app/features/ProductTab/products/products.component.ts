import { Component, inject, signal } from '@angular/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { BaseApiService } from '../../../services/base-api.service';
import { ProductList } from '../../../Models/product.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationResult } from '../../../Models/Pagination.model';
import { PaginationService } from '../../../services/pagination.service';

@Component({
  selector: 'app-products',
  imports: [TableModule, DropdownModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  constructor(private api: BaseApiService) { }
  confirmation = inject(ConfirmationService);
  msg = inject(MessageService);
  router = inject(Router);
  pagination = inject(PaginationService);

  totalrecords=signal<number>(0);
  products = signal<ProductList[]>([]);
 
  loadProducts(event: TableLazyLoadEvent){
    this.pagination.getData<ProductList>('Products',event).subscribe({
      next:(result)=>{
        this.products.set(result.data);
        console.log("Data Length", result.data.length);
        this.totalrecords.set(result.total);
      },
      error: (err) => {
          this.api.handleError(err, err.error.message);
        }
    })
  }
  deleteProduct(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Product?',
      header: 'Product Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.api.delete<void>('Products', id).subscribe({
          next: () => {
            this.products.update(products=>(products.filter(p=>p.id!==id)));
            this.msg.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Product Deleted Successfully'
            });
          },
          error: (err) => {
            this.api.handleError(err, err.error?.message);
          }
        });
      },
      reject: () => {
        // Optional: handle rejection
      }

    });
  }
  editProduct(id: string){
    this.router.navigate(['Inventory/editproduct',id]);
  }

}
