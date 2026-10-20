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
import { PurchaseInvoiceFulfillmentStatus, PurchaseInvoiceList, PurchaseInvoiceSearch, PurchaseInvoiceStatus } from '../../../../Models/Inventory/PurchaseInvoice.model';

@Component({
  selector: 'app-purchase-invoice-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule],
  templateUrl: './purchase-invoice-list.component.html',
  styleUrl: './purchase-invoice-list.component.css',
})
export class PurchaseInvoiceListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  purchaseInvoiceList = signal<PurchaseInvoiceList[]>([]);
  purchaseInvoiceSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseInvoiceList');
  purchaseInvoiceSearchList = this.purchaseInvoiceSearch.result;
  SupplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  SupplierSearchSearchList = this.SupplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  piStatus = PurchaseInvoiceStatus;
  piFulfillmentStatus = PurchaseInvoiceFulfillmentStatus

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  piStatusOptions = signal(enumToOptions(PurchaseInvoiceStatus, true));
  piFulfillmentStatusOptions = signal(enumToOptions(PurchaseInvoiceFulfillmentStatus, true));


  //Model For FormData
  private readonly initialModel: PurchaseInvoiceSearch = {
    id: null,
    supplierId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    fulfillmentStatus: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  piFormModel = signal<PurchaseInvoiceSearch>({ ...this.initialModel });

  // Signal form with validation schema
  piForm = form(this.piFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof PurchaseInvoiceSearch>(field: K, value: PurchaseInvoiceSearch[K]) {
    this.piFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadPI(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.piForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<PurchaseInvoiceList, PurchaseInvoiceSearch>('PurchaseInvoice/GetAll', payload).subscribe({
      next: (result) => {
        this.purchaseInvoiceList.set(result.data);
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
    this.loadPI('fresh');
  }

  editPI(id: string) {
    this.router.navigate(['Inventory/editpurchaseinvoice', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deletePI(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this PI?',
      header: 'PI Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('PurchaseInvoice', id).subscribe({
          next: () => {
            this.purchaseInvoiceList.update(purchaseInvoiceList => (purchaseInvoiceList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'PI Deleted Successfully', false);
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
  ApprovePI(id: string) {
    this.dataService.postAction<void>('PurchaseInvoice/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'PI Approved Successfully', false);
        this.loadPI('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelPI(id: string) {
    this.dataService.postAction<void>('PurchaseInvoice/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'PI Cancelled Successfully', false);
        this.loadPI('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  piStatusLabel(status: PurchaseInvoiceStatus): string {
    return PurchaseInvoiceStatus[status];
  }
  piFulfillmentStatusLabel(status: PurchaseInvoiceFulfillmentStatus): string {
    return PurchaseInvoiceFulfillmentStatus[status];
  }
  getPIStatusClass(status: PurchaseInvoiceStatus): string {
    switch (status) {
      case PurchaseInvoiceStatus.Draft:
        return 'status-draft';
      case PurchaseInvoiceStatus.Approved:
        return 'status-active';
      case PurchaseInvoiceStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
