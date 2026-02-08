import { Component, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { Table, TableLazyLoadEvent, TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { ProductList, ProductSearch } from '../../../../Models/product.model';
import { AutoDropdown } from '../../../../Models/Pagination.model';

@Component({
  selector: 'app-products',
  imports: [TableModule,AutoCompleteModule,ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  constructor() { }
  confirmation = inject(ConfirmationService);
  base=inject(BaseApiService);
  msg = inject(MessageService);
  router = inject(Router);
  pagination = inject(PaginationService);
  fb = inject(FormBuilder);
  dataService = inject(DataLayerService);

  totalrecords=signal<number>(0);
  products = signal<ProductList[]>([]);
  suppliersearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/Suppliers');
  suppliers = this.suppliersearch.result;
  productsearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/Products');
  productByName= this.productsearch.result;
  @ViewChild('dt') dt!: Table;

  producSearchForm: FormGroup= this.fb.group({
    productId: [null],
    supplierId: [null]
  });

  loadProducts(event: TableLazyLoadEvent){
    console.log("Lazy Loading Triggered");
    const formValue = this.producSearchForm.value;
    this.pagination.getData<ProductList,ProductSearch>('Products/GetAll',event,formValue).subscribe({
      next:(result)=>{
        this.products.set(result.data);
        this.totalrecords.set(result.total);
      },
      error: (err) => {
          this.base.handleError(err, err.error.message);
        }
    })
  }
  OnSearch(){
    console.log("Event Triggered");
    this.dt.reset();
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
        this.dataService.delete<void>('Products', id).subscribe({
          next: () => {
            this.products.update(products=>(products.filter(p=>p.id!==id)));
            this.msg.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Product Deleted Successfully'
            });
          },
          error: (err) => {
            this.base.handleError(err, err.error?.message);
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
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }


}
