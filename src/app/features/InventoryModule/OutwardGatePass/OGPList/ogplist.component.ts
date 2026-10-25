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
import { PurchaseReturnFulfillmentStatus, PurchaseReturnList, PurchaseReturnSearch, PurchaseReturnSourceModule, PurchaseReturnStatus } from '../../../../Models/Inventory/PurchaseRetrun.model';
import { GatePassFulfillmentStatus, GatePassStatus, OutwardGatePassList, OutwardGatePassSearch, OutwardGatePassSourceModule } from '../../../../Models/Inventory/OGP.model';


@Component({
  selector: 'app-ogplist',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, CommonModule],
  templateUrl: './ogplist.component.html',
  styleUrl: './ogplist.component.css',
})
export class OGPListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  ogpList = signal<OutwardGatePassList[]>([]);
  ogpSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/OutwardGatePassList');
  ogpSearchList = this.ogpSearch.result;
  SupplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  SupplierSearchSearchList = this.SupplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  ogpStatus = GatePassStatus;
  ogpFulfillmentStatus = GatePassFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  ogpStatusOptions = signal(enumToOptions(GatePassStatus, true));
  ogpFulfillmentStatusOptions = signal(enumToOptions(GatePassFulfillmentStatus, true));
  ogpSourceModuleOptions = signal(enumToOptions(OutwardGatePassSourceModule, true));


  //Model For FormData
  private readonly initialModel: OutwardGatePassSearch = {
    id: null,
    supplierId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    status: null,
    fulfillmentStatus: null,
    sourceModule: null,
    nextCursor: null,
    previousCursor: null,
    customerId: null
  };
  //Signal Model For FormData
  ogpFormModel = signal<OutwardGatePassSearch>({ ...this.initialModel });

  // Signal form with validation schema
  ogpForm = form(this.ogpFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof OutwardGatePassSearch>(field: K, value: OutwardGatePassSearch[K]) {
    this.ogpFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadOGP(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.ogpForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<OutwardGatePassList, OutwardGatePassSearch>('OutwardGatePass/GetAll', payload).subscribe({
      next: (result) => {
        this.ogpList.set(result.data);
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
    this.loadOGP('fresh');
  }

  editOGP(id: string) {
    this.router.navigate(['Inventory/editogp', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deleteOGP(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this OGP?',
      header: 'OGP Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('OutwardGatePass', id).subscribe({
          next: () => {
            this.ogpList.update(ogpList => (ogpList.filter(o => o.id !== id)));
            this.base.globalMessage('success', 'OGP Deleted Successfully', false);
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
  ApproveOGP(id: string) {
    this.dataService.postAction<void>('OutwardGatePass/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'OGP Approved Successfully', false);
        this.loadOGP('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelOGP(id: string) {
    this.dataService.postAction<void>('OutwardGatePass/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'OGP Cancelled Successfully', false);
        this.loadOGP('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  ogpStatusLabel(status: GatePassStatus): string {
    return GatePassStatus[status];
  }
  ogpFulfillmentStatusLabel(status: GatePassFulfillmentStatus): string {
    return GatePassFulfillmentStatus[status];
  }
  getOGPStatusClass(status: GatePassStatus): string {
    switch (status) {
      case GatePassStatus.Draft:
        return 'status-draft';
      case GatePassStatus.Approved:
        return 'status-active';
      case GatePassStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }

}
