import { Component, inject, signal, WritableSignal } from '@angular/core';
import { BaseApiService } from '../../../../services/base-api.service';
import { Router } from '@angular/router';
import { PaginationService } from '../../../../services/pagination.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PurchaseRequisitionFulfillmentStatus, PurchaseRequisitionList, PurchaseRequisitionSearch, PurchaseRequisitionStatus } from '../../../../Models/Inventory/PurchaseRequisition.model';
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

@Component({
  selector: 'app-purchase-requisition-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule],
  templateUrl: './purchase-requisition-list.component.html',
  styleUrl: './purchase-requisition-list.component.css',
})
export class PurchaseRequisitionListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);


  prList = signal<PurchaseRequisitionList[]>([]);
  prSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseRequisitionList');
  prSearchList = this.prSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  prStatus = PurchaseRequisitionStatus;
  prFulfillmentStatus = PurchaseRequisitionFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  prStatusOptions = signal(enumToOptions(PurchaseRequisitionStatus, true));
  prFulfillmentStatusOptions = signal(enumToOptions(PurchaseRequisitionFulfillmentStatus, true));


  //Model For FormData
  private readonly initialModel: PurchaseRequisitionSearch = {
    id: null,
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
  prFormModel = signal<PurchaseRequisitionSearch>({ ...this.initialModel });

  // Signal form with validation schema
  prForm = form(this.prFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof PurchaseRequisitionSearch>(field: K, value: PurchaseRequisitionSearch[K]) {
    this.prFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadPrs(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.prForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<PurchaseRequisitionList, PurchaseRequisitionSearch>('PurchaseRequisition/GetAll', payload).subscribe({
      next: (result) => {
        this.prList.set(result.data);
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
    this.loadPrs('fresh');
  }

  editPr(id: string) {
    this.router.navigate(['Inventory/editpurchaserequisition', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deletePR(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Purchase Requisition?',
      header: 'Purchase Requisition Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('PurchaseRequisition', id).subscribe({
          next: () => {
            this.prList.update(prList => (prList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Purchase Requisition Deleted Successfully', false);
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
  ApprovePr(id: string) {
    this.dataService.postAction<void>('PurchaseRequisition/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Purchase Requisition Approved Successfully', false);
        this.loadPrs('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelPr(id: string) {
    this.dataService.postAction<void>('PurchaseRequisition/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Purchase Requisition Cancelled Successfully', false);
        this.loadPrs('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  prStatusLabel(status: PurchaseRequisitionStatus): string {
    return PurchaseRequisitionStatus[status];
  }
  prFulfillmentStatusLabel(status: PurchaseRequisitionFulfillmentStatus): string {
    return PurchaseRequisitionFulfillmentStatus[status];
  }
  getPrStatusClass(status: PurchaseRequisitionStatus): string {
    switch (status) {
      case PurchaseRequisitionStatus.Draft:
        return 'status-draft';
      case PurchaseRequisitionStatus.Approved:
        return 'status-active';
      case PurchaseRequisitionStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
