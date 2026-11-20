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
import { enumToOptions, openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService } from 'primeng/api';
import { Component, inject, signal, WritableSignal } from '@angular/core';
import { SaleOrderList, SaleOrderSearch, SalesOrderFulfillmentStatus, SalesOrderInvoicingStatus, SalesOrderStatus } from '../../../../Models/Sale/SaleOrder.model';

@Component({
  selector: 'app-sale-order-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, CommonModule],
  templateUrl: './sale-order-list.component.html',
  styleUrl: './sale-order-list.component.css',
})
export class SaleOrderListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);


  soList = signal<SaleOrderList[]>([]);
  soSearch = this.pagination.autoSearchDropdown<AutoDropdown>('SalesDropDown/SaleOrderList');
  soSearchList = this.soSearch.result;
  CustomerSearch = this.pagination.autoSearchDropdown<AutoDropdown>('SalesDropDown/CustomersList');
  CustomerSearchList = this.CustomerSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  soStatus = SalesOrderStatus;
  soFulfillmentStatus = SalesOrderFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  soStatusOptions = signal(enumToOptions(SalesOrderStatus, true));
  soFulfillmentStatusOptions = signal(enumToOptions(SalesOrderFulfillmentStatus, true));
  soInvoiceStatusOptions = signal(enumToOptions(SalesOrderInvoicingStatus, true));


  //Model For FormData
  private readonly initialModel: SaleOrderSearch = {
    id: null,
    customerId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    fulfillmentStatus: null,
    invoicingStatus: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  soFormModel = signal<SaleOrderSearch>({ ...this.initialModel });

  // Signal form with validation schema
  soForm = form(this.soFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof SaleOrderSearch>(field: K, value: SaleOrderSearch[K]) {
    this.soFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadSo(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.soForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<SaleOrderList, SaleOrderSearch>('SaleOrder/GetAll', payload).subscribe({
      next: (result) => {
        this.soList.set(result.data);
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
    this.loadSo('fresh');
  }

  editSo(id: string) {
    this.router.navigate(['Sales/saleorderedit', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deleteSO(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Sake Order?',
      header: 'Sale Order Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('PurchaseOrder', id).subscribe({
          next: () => {
            this.soList.update(soList => (soList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Sale Order Deleted Successfully', false);
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
  ApproveSo(id: string) {
    this.dataService.postAction<void>('SaleOrder/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Sale Order Approved Successfully', false);
        this.loadSo('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelSo(id: string) {
    this.dataService.postAction<void>('SaleOrder/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Sale Order Cancelled Successfully', false);
        this.loadSo('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  soStatusLabel(status: SalesOrderStatus): string {
    return SalesOrderStatus[status];
  }
  soFulfillmentStatusLabel(status: SalesOrderFulfillmentStatus): string {
    return SalesOrderFulfillmentStatus[status];
  }
  soinvoiceStatusLabel(status: SalesOrderInvoicingStatus): string {
    return SalesOrderInvoicingStatus[status];
  }
  getSoStatusClass(status: SalesOrderStatus): string {
    switch (status) {
      case SalesOrderStatus.Draft:
        return 'status-draft';
      case SalesOrderStatus.Approved:
        return 'status-active';
      case SalesOrderStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
  getSaleOrderReport(id: string, landscape: boolean) {
    const newTab = openLoadingTab();

    this.dataService.getReport('SaleOrder/report', `${id}?landscape=${landscape}`)
      .subscribe({
        next: (blob) => showBlobInTab(newTab, blob, `SaleOrder-Report-${id}.pdf`),
        error: (err) => {
          if (newTab) newTab.close();
          this.base.handleError(err, err.error?.message);
        }
      });
  }


}
