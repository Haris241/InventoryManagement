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
import { StockTransferListDto, StockTransferMode, StockTransferSearchDto, StockTransferStatus } from '../../../../Models/Inventory/StockTransfer.model';

@Component({
  selector: 'app-stockt-transfer-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, CommonModule],
  templateUrl: './stockt-transfer-list.component.html',
  styleUrl: './stockt-transfer-list.component.css',
})
export class StocktTransferListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  stList = signal<StockTransferListDto[]>([]);
  stSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/StockTransferList');
  stSearchList = this.stSearch.result;
  FromWareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  FromWareHouseSearchSearchList = this.FromWareHouseSearch.result;
  ToWareHouseSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/WareHouseList');
  ToWareHouseSearchSearchList = this.ToWareHouseSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  stStatus = StockTransferStatus;
  stMode = StockTransferMode;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  stStatusOptions = signal(enumToOptions(StockTransferStatus, true));
  stModeOptions = signal(enumToOptions(StockTransferMode, true));

  //Model For FormData
  private readonly initialModel: StockTransferSearchDto = {
    id: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    mode: null,
    fromWarehouseId: null,
    toWarehouseId: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  stFormModel = signal<StockTransferSearchDto>({ ...this.initialModel });

  // Signal form with validation schema
  stForm = form(this.stFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof StockTransferSearchDto>(field: K, value: StockTransferSearchDto[K]) {
    this.stFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadST(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.stForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<StockTransferListDto, StockTransferSearchDto>('StockTransfer/GetAll', payload).subscribe({
      next: (result) => {
        this.stList.set(result.data);
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
    this.loadST('fresh');
  }

  editST(id: string) {
    this.router.navigate(['Inventory/editstocktransfer', id]);
  }
  RecievedST(id: string) {
    this.router.navigate(['Inventory/recievestocktransfer', id]);
  }


  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }

  deleteST(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Transfer?',
      header: 'Transfer Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('StockTransfer', id).subscribe({
          next: () => {
            this.stList.update(stList => (stList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Transfer Deleted Successfully', false);
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

  ApproveST(id: string) {
    this.dataService.postAction<void>('StockTransfer/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Stock Transfer Approved Successfully', false);
        this.loadST('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }


  CancelST(id: string) {
    this.dataService.postAction<void>('StockTransfer/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Stock Transfer Cancelled Successfully', false);
        this.loadST('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  stStatusLabel(status: StockTransferStatus): string {
    return StockTransferStatus[status];
  }

  saModeLabel(reason: StockTransferMode): string {
    return StockTransferMode[reason];
  }

  getSTStatusClass(status: StockTransferStatus): string {
    switch (status) {
      case StockTransferStatus.Draft:
        return 'status-draft';
      case StockTransferStatus.Approved:
        return 'status-active';
      case StockTransferStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }

}
