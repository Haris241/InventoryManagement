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
import { SupplierListDto, SupplierSearch } from '../../../../Models/Inventory/Supplier.model';

@Component({
  selector: 'app-suppliers',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  supplierList = signal<SupplierListDto[]>([]);
  supplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  supplierSearchList = this.supplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: SupplierSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  supplierFormModel = signal<SupplierSearch>({ ...this.initialModel });

  // Signal form with validation schema
  supplierForm = form(this.supplierFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof SupplierSearch>(field: K, value: SupplierSearch[K]) {
    this.supplierFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadSuppliers(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.supplierForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<SupplierListDto, SupplierSearch>('Supplier/GetAll', payload).subscribe({
      next: (result) => {
        this.supplierList.set(result.data);
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
    this.loadSuppliers('fresh');
  }

  editSupplier(id: string) {
    this.router.navigate(['Inventory/editsupplier', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length >= 1) {
      searchtermsignal.set(search);
    }
  }
}
