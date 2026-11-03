import { BaseApiService } from '../../../../services/base-api.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../services/pagination.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { enumToOptions, toDateOnlyString } from '../../../../shared/Utility';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService } from 'primeng/api';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { StockAdjustmentList, StockAdjustmentReason, StockAdjustmentSearch, StockAdjustmentStatus } from '../../../../Models/Inventory/StockAdjustment.model';

@Component({
  selector: 'app-stock-adjustment-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, CommonModule],
  templateUrl: './stock-adjustment-list.component.html',
  styleUrl: './stock-adjustment-list.component.css',
})
export class StockAdjustmentListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  saList = signal<StockAdjustmentList[]>([]);
  saSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/StockAdjustmentList');
  saSearchList = this.saSearch.result;
  WareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  WareHouseSearchSearchList = this.WareHouseSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  saStatus = StockAdjustmentStatus;
  saReason = StockAdjustmentReason;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  saStatusOptions = signal(enumToOptions(StockAdjustmentStatus, true));
  saReasonsOptions = signal(enumToOptions(StockAdjustmentReason, true));

  //Model For FormData
  private readonly initialModel: StockAdjustmentSearch = {
    id: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    reason: null,
    warehouseId: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  saFormModel = signal<StockAdjustmentSearch>({ ...this.initialModel });

  // Signal form with validation schema
  saForm = form(this.saFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof StockAdjustmentSearch>(field: K, value: StockAdjustmentSearch[K]) {
    this.saFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadSA(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.saForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<StockAdjustmentList, StockAdjustmentSearch>('StockAdjustment/GetAll', payload).subscribe({
      next: (result) => {
        this.saList.set(result.data);
        this.hasNextPage.set(result.hasNextPage);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(result.previousCursor ?? null);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.formSubmitted.set(false);
      }
    });
  }

  OnSearch() {
    this.nextCursor.set(null);
    this.previousCursor.set(null);
    this.loadSA('fresh');
  }

  editSA(id: string) {
    this.router.navigate(['Inventory/editstockadjustment', id]);
  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  deleteSA(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Adjustment?',
      header: 'Adjustment Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('StockAdjustment', id).subscribe({
          next: () => {
            this.saList.update(saList => (saList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Adjustment Deleted Successfully', false);
          },
          error: (err) => {
            this.base.handleError(err, err.error?.message);
          }
        });
      },
      reject: () => {
        // Optional: handle rejection
      }
    });
  }

  ApproveSA(id: string) {
    this.dataService.postAction<void>('StockAdjustment/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Stock Adjustment Approved Successfully', false);
        this.loadSA('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  CancelSA(id: string) {
    this.dataService.postAction<void>('StockAdjustment/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Stock Adjustment Cancelled Successfully', false);
        this.loadSA('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  saStatusLabel(status: StockAdjustmentStatus): string {
    return StockAdjustmentStatus[status];
  }

  saReasonLabel(reason: StockAdjustmentReason): string {
    return StockAdjustmentReason[reason];
  }

  getSAStatusClass(status: StockAdjustmentStatus): string {
    switch (status) {
      case StockAdjustmentStatus.Draft:
        return 'status-draft';
      case StockAdjustmentStatus.Approved:
        return 'status-active';
      case StockAdjustmentStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
