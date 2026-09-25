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
import { TaxList, TaxSearch } from '../../../../Models/Accouting/Tax.model';

@Component({
  selector: 'app-tax-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './tax-list.component.html',
  styleUrl: './tax-list.component.css',
})
export class TaxListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  taxList = signal<TaxList[]>([]);
  taxSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/TaxList');
  taxSearchList = this.taxSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: TaxSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  taxFormModel = signal<TaxSearch>({ ...this.initialModel });

  // Signal form with validation schema
  taxForm = form(this.taxFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof TaxSearch>(field: K, value: TaxSearch[K]) {
    this.taxFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadTaxes(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.taxForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<TaxList, TaxSearch>('Tax/GetAll', payload).subscribe({
      next: (result) => {
        this.taxList.set(result.data);
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
    this.loadTaxes('fresh');
  }

  editTax(id: string) {
    this.router.navigate(['Accounts/taxEdit', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
}
