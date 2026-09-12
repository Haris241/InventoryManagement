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
import { DepartmentListDto, DepartmentSearch } from '../../../../Models/Inventory/Department.model';

@Component({
  selector: 'app-department-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, FormField, CommonModule],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.css',
})
export class DepartmentListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);

  departmentList = signal<DepartmentListDto[]>([]);
  departmentSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/DepartmentList');
  departmentSearchList = this.departmentSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Model For FormData
  private readonly initialModel: DepartmentSearch = {
    id: null,
    isActive: true,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  departmentModel = signal<DepartmentSearch>({ ...this.initialModel });

  // Signal form with validation schema
  departmentForm = form(this.departmentModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof DepartmentSearch>(field: K, value: DepartmentSearch[K]) {
    this.departmentModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadDepartments(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.departmentForm().value();
    this.formSubmitted.set(true);


    // attach cursors based on direction
    const payload = { ...formValue, nextCursor: direction === 'next' ? this.nextCursor() : null, previousCursor: direction === 'previous' ? this.previousCursor() : null };
    this.pagination.getDataCursor<DepartmentListDto, DepartmentSearch>('Department/GetAll', payload).subscribe({
      next: (result) => {
        this.departmentList.set(result.data);
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
    this.loadDepartments('fresh');
  }

  editDepartment(id: string) {
    this.router.navigate(['Inventory/editdepartment', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length >= 1) {
      searchtermsignal.set(search);
    }
  }
}
