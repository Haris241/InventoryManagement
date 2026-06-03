import { Component, WritableSignal, inject, signal, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../services/pagination.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { AccountKind, AccountType, COAList, COASearchDto } from '../../../../Models/Accouting/ChartOfAccount.model';
import { form, FormField } from '@angular/forms/signals';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { enumToOptions } from '../../../../shared/Utility';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coalist',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './coalist.component.html',
  styleUrl: './coalist.component.css',
})
export class COAListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  CoaList = signal<COAList[]>([]);
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/COA');
  coaSearchList = this.coaSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  accoundKind = signal(enumToOptions(AccountKind, true));
  accountType = signal(enumToOptions(AccountType, true));

  //Model For FormData
  private readonly initialModel: COASearchDto = {
    id: null,
    category: null,
    kind: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  coaModel = signal<COASearchDto>({ ...this.initialModel });

  // Signal form with validation schema
  coaForm = form(this.coaModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof COASearchDto>(field: K, value: COASearchDto[K]) {
    this.coaModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadCOA(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.coaForm().value();

    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<COAList, COASearchDto>('COA/GetAll', payload).subscribe({
      next: (result) => {
        this.CoaList.set(result.data);
        this.hasNextPage.set(result.hasNextPage);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(result.previousCursor ?? null);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    })
  }
  OnSearch() {
    this.nextCursor.set(null);
    this.previousCursor.set(null);
    this.loadCOA('fresh');
  }

  editCOA(id: string) {
    this.router.navigate(['Accounts/coaEdit', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

}
