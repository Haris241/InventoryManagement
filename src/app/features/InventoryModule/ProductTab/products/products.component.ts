import { Component, inject, signal, ViewChild, WritableSignal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { ProductListDTO, ProductSearchDTO, ProductType } from '../../../../Models/Inventory/Product.model';
import { enumToOptions } from '../../../../shared/Utility';
import { form, FormField } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-products',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, FormField, CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  productList = signal<ProductListDTO[]>([]);
  productSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Products');
  productSearchList = this.productSearch.result;
  productCategory = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/ProductCategories');
  productCategoryList = this.productCategory.result;
  brand = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/Brands');
  brandList = this.brand.result;
  productTypes = signal(enumToOptions(ProductType, true));


  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: ProductSearchDTO = {
    productId: null,
    productCategoryId: null,
    brandId: null,
    productType: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  productModel = signal<ProductSearchDTO>({ ...this.initialModel });

  // Signal form with validation schema
  productForm = form(this.productModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductSearchDTO>(field: K, value: ProductSearchDTO[K]) {
    this.productModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadProducts(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.productForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<ProductListDTO, ProductSearchDTO>('Products/GetAll', payload).subscribe({
      next: (result) => {
        this.productList.set(result.data);
        this.hasNextPage.set(result.hasNextPage);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(result.previousCursor ?? null);
        this.formSubmitted.set(false);

      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
        this.formSubmitted.set(false);

      }
    })
  }
  OnSearch() {
    this.nextCursor.set(null);
    this.previousCursor.set(null);
    this.loadProducts('fresh');
  }

  editProduct(id: string) {
    this.router.navigate(['Inventory/editproduct', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

}
