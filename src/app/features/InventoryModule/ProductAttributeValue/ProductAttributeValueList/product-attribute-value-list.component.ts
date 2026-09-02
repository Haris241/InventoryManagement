import { Component, WritableSignal, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
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
import { ProductAttributeValueList, ProductAttributeValueSearch } from '../../../../Models/Inventory/AttributeValue.model';

@Component({
  selector: 'app-product-attribute-value-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './product-attribute-value-list.component.html',
  styleUrl: './product-attribute-value-list.component.css',
})
export class ProductAttributeValueListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  attributeValueList = signal<ProductAttributeValueList[]>([]);
  attributeSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/AttributeValuesList');
  attributeSearchList = this.attributeSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: ProductAttributeValueSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  attributeValueModel = signal<ProductAttributeValueSearch>({ ...this.initialModel });

  // Signal form with validation schema
  attributeValueForm = form(this.attributeValueModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof ProductAttributeValueSearch>(field: K, value: ProductAttributeValueSearch[K]) {
    this.attributeValueModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadAttributeValues(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.attributeValueForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<ProductAttributeValueList, ProductAttributeValueSearch>('ProductAttributeValue/GetAll', payload).subscribe({
      next: (result) => {
        this.attributeValueList.set(result.data);
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
    this.loadAttributeValues('fresh');
  }

  editAttributeValue(id: string) {
    this.router.navigate(['Inventory/editproductattribute', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length >= 1) {
      searchtermsignal.set(search);
    }
  }

}
