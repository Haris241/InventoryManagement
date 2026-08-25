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
import { WareHouseList, WareHouseSearch } from '../../../../Models/Inventory/WareHouse.model';

@Component({
  selector: 'app-warehous-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, FormField, CommonModule],
  templateUrl: './warehous-list.component.html',
  styleUrl: './warehous-list.component.css',
})
export class WarehousListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  warehouseList = signal<WareHouseList[]>([]);
  warehouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  warehouseSearchList = this.warehouseSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: WareHouseSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  warehouseModel = signal<WareHouseSearch>({ ...this.initialModel });

  // Signal form with validation schema
  warehouseForm = form(this.warehouseModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof WareHouseSearch>(field: K, value: WareHouseSearch[K]) {
    this.warehouseModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadWarehouses(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.warehouseForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<WareHouseList, WareHouseSearch>('WareHouse/GetAll', payload).subscribe({
      next: (result) => {
        this.warehouseList.set(result.data);
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
    this.loadWarehouses('fresh');
  }

  editWareHouse(id: string) {
    this.router.navigate(['Inventory/editwarehouse', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }
}
