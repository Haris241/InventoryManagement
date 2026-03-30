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
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/COA');
  coaSearchList = this.coaSearch.result;
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  @ViewChild('dt') dt!: Table;
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

  loadCOA() {
    const formValue = this.coaForm().value();
    this.pagination.getDataCursor<COAList, COASearchDto>('COA/GetAll', formValue).subscribe({
      next: (result) => {
        this.CoaList.set(result.data);
        this.hasNextPage.set(result.hasNextPage);
        this.hasPreviousPage.set(result.hasPreviousPage);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    })
  }
  OnSearch() {
    this.dt.reset();
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
