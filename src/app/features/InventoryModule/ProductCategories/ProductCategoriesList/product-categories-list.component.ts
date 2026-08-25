import { Component, WritableSignal, inject, signal, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { form, FormField } from '@angular/forms/signals';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { ProductCategoriesList, ProductCategoriesSearch } from '../../../../Models/Inventory/ProductCategories.model';

@Component({
  selector: 'app-product-categories-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './product-categories-list.component.html',
  styleUrl: './product-categories-list.component.css',
})
export class ProductCategoriesListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  productCategoriesList = signal<ProductCategoriesList[]>([]);
  productCategoriesSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/ProductCategories');
  productCategoriesSearchList = this.productCategoriesSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: ProductCategoriesSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  productCategoriesModel = signal<ProductCategoriesSearch>({ ...this.initialModel });

  // Signal form with validation schema
  productCategoriesForm = form(this.productCategoriesModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductCategoriesSearch>(field: K, value: ProductCategoriesSearch[K]) {
    this.productCategoriesModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadProductCategories(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.productCategoriesForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<ProductCategoriesList, ProductCategoriesSearch>('ProductCategories/GetAll', payload).subscribe({
      next: (result) => {
        this.productCategoriesList.set(result.data);
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
    this.loadProductCategories('fresh');
  }

  editProductCategories(id: string) {
    this.router.navigate(['Inventory/editproductcategory', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
}
