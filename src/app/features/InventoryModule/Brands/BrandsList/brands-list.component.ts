import { CommonModule } from '@angular/common';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { Router } from '@angular/router';
import { DataLayerService } from '../../../../services/data-layer.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { BrandList, BrandSearch } from '../../../../Models/Inventory/Brand.model';


@Component({
  selector: 'app-brands-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, FormField, CommonModule],
  templateUrl: './brands-list.component.html',
  styleUrl: './brands-list.component.css',
})
export class BrandsListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  brandList = signal<BrandList[]>([]);
  brandSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/BrandsList');
  brandSearchList = this.brandSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: BrandSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  brandModel = signal<BrandSearch>({ ...this.initialModel });

  // Signal form with validation schema
  brandForm = form(this.brandModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof BrandSearch>(field: K, value: BrandSearch[K]) {
    this.brandModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadBrands(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.brandForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<BrandList, BrandSearch>('Brands/GetAll', payload).subscribe({
      next: (result) => {
        this.brandList.set(result.data);
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
    this.loadBrands('fresh');
  }

  editBrand(id: string) {
    this.router.navigate(['Inventory/editbrand', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
}
