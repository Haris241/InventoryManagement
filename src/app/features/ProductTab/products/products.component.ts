import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Router, RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { BaseApiService } from '../../../services/base-api.service';
import { Product, ProductList } from '../../../Models/product.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PaginationResult } from '../../../Models/Pagination.model';

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
  router = inject(Router)

  products = signal<PaginationResult<ProductList>>({
    items: [],
    pageNumber: 1,
    pageSize: 10,
    hasNextPage: false,
    hasPreviousPage: false
});
  ngOnInit() {
    this.api.getAll<PaginationResult<ProductList>>('Products').subscribe({
      next: (data: PaginationResult<ProductList>) => {
        this.products.set(data);
      },
      error: (err) => {
        this.api.handleError(err, err.error.message);
      }
    });
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
            this.products.update(products=>({
              ...products,items: products.items.filter(p=>p.id!==id)}));
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
