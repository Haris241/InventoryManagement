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
import { FloatLabel } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { CustomerList, CustomerSearch, CustomerType } from '../../../../Models/Sale/Customer.model';
import { enumToOptions } from '../../../../shared/Utility';


@Component({
  selector: 'app-customer-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, FormField, CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css',
})
export class CustomerListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  customerList = signal<CustomerList[]>([]);
  customerSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/CustomersList');
  customerSearchList = this.customerSearch.result;
  customerTypes = signal(enumToOptions(CustomerType, true));

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: CustomerSearch = {
    id: null,
    isActive: true,
    customerType: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  customerFormModel = signal<CustomerSearch>({ ...this.initialModel });

  // Signal form with validation schema
  customerForm = form(this.customerFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CustomerSearch>(field: K, value: CustomerSearch[K]) {
    this.customerFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadcustomers(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.customerForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<CustomerList, CustomerSearch>('Customer/GetAll', payload).subscribe({
      next: (result) => {
        this.customerList.set(result.data);
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
    this.loadcustomers('fresh');
  }

  editcustomer(id: string) {
    this.router.navigate(['Inventory/editcustomer', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
}
