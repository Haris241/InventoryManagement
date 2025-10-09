import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { BaseApiService } from '../../../services/base-api.service';
import { Product } from '../../../Models/product.model';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-products',
  imports: [TableModule, RouterLink, DropdownModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  constructor(private api: BaseApiService) { }
  confirmation = inject(ConfirmationService);
  msg = inject(MessageService);

  products = signal<Product[]>([]);
  ngOnInit() {
    this.api.getAll<Product>('Products').subscribe({
      next: (data: Product[]) => {
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
            this.products.update(products=>products.filter(p=>p.id!==id) );
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

}
