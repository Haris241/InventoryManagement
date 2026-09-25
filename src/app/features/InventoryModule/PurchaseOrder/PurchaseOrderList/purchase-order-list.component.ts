import { BaseApiService } from '../../../../services/base-api.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../services/pagination.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { enumToOptions, toDateOnlyString } from '../../../../shared/Utility';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService } from 'primeng/api';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { PurchaseOrderFulfillmentStatus, PurchaseOrderList, PurchaseOrderSearch, PurchaseOrderSourceModule, PurchaseOrderStatus } from '../../../../Models/Inventory/PurchaseOrder.model';

@Component({
  selector: 'app-purchase-order-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule],
  templateUrl: './purchase-order-list.component.html',
  styleUrl: './purchase-order-list.component.css',
})
export class PurchaseOrderListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);


  poList = signal<PurchaseOrderList[]>([]);
  poSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseOrderList');
  poSearchList = this.poSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  poStatus = PurchaseOrderStatus;
  poFulfillmentStatus = PurchaseOrderFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  poStatusOptions = signal(enumToOptions(PurchaseOrderStatus, true));
  poFulfillmentStatusOptions = signal(enumToOptions(PurchaseOrderFulfillmentStatus, true));
  poSourceModuleOptions = signal(enumToOptions(PurchaseOrderSourceModule, true));


  //Model For FormData
  private readonly initialModel: PurchaseOrderSearch = {
    id: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    fulfillmentStatus: null,
    sourceModule: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  poFormModel = signal<PurchaseOrderSearch>({ ...this.initialModel });

  // Signal form with validation schema
  poForm = form(this.poFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof PurchaseOrderSearch>(field: K, value: PurchaseOrderSearch[K]) {
    this.poFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadPo(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.poForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<PurchaseOrderList, PurchaseOrderSearch>('PurchaseOrder/GetAll', payload).subscribe({
      next: (result) => {
        this.poList.set(result.data);
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
    this.loadPo('fresh');
  }

  editPo(id: string) {
    this.router.navigate(['Inventory/editpurchaseorder', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deletePO(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Purchase Order?',
      header: 'Purchase Order Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('PurchaseOrder', id).subscribe({
          next: () => {
            this.poList.update(poList => (poList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Purchase Order Deleted Successfully', false);
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
  ApprovePo(id: string) {
    this.dataService.postAction<void>('PurchaseOrder/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Purchase Order Approved Successfully', false);
        this.loadPo('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelPo(id: string) {
    this.dataService.postAction<void>('PurchaseOrder/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Purchase Order Cancelled Successfully', false);
        this.loadPo('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  poStatusLabel(status: PurchaseOrderStatus): string {
    return PurchaseOrderStatus[status];
  }
  poFulfillmentStatusLabel(status: PurchaseOrderFulfillmentStatus): string {
    return PurchaseOrderFulfillmentStatus[status];
  }
  getPoStatusClass(status: PurchaseOrderStatus): string {
    switch (status) {
      case PurchaseOrderStatus.Draft:
        return 'status-draft';
      case PurchaseOrderStatus.Approved:
        return 'status-active';
      case PurchaseOrderStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
