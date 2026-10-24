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
import { GRNFulfillmentStatus, GRNList, GRNSearch, GRNSourceModule, GRNStatus } from '../../../../Models/Inventory/GRN.model';
import { PurchaseReturnFulfillmentStatus, PurchaseReturnList, PurchaseReturnSearch, PurchaseReturnSourceModule, PurchaseReturnStatus } from '../../../../Models/Inventory/PurchaseRetrun.model';

@Component({
  selector: 'app-purchase-return-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabel, SelectModule, CommonModule],
  templateUrl: './purchase-return-list.component.html',
  styleUrl: './purchase-return-list.component.css',
})
export class PurchaseReturnListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  prList = signal<PurchaseReturnList[]>([]);
  prSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/PurchaseReturnList');
  prSearchList = this.prSearch.result;
  SupplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  SupplierSearchSearchList = this.SupplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  prStatus = PurchaseReturnStatus;
  prFulfillmentStatus = PurchaseReturnFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  prStatusOptions = signal(enumToOptions(PurchaseReturnStatus, true));
  prFulfillmentStatusOptions = signal(enumToOptions(PurchaseReturnFulfillmentStatus, true));
  prSourceModuleOptions = signal(enumToOptions(PurchaseReturnSourceModule, true));


  //Model For FormData
  private readonly initialModel: PurchaseReturnSearch = {
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
  };
  //Signal Model For FormData
  prFormModel = signal<PurchaseReturnSearch>({ ...this.initialModel });

  // Signal form with validation schema
  prForm = form(this.prFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof PurchaseReturnSearch>(field: K, value: PurchaseReturnSearch[K]) {
    this.prFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadPR(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.prForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<PurchaseReturnList, PurchaseReturnSearch>('PurchaseReturn/GetAll', payload).subscribe({
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
    this.loadPR('fresh');
  }

  editPR(id: string) {
    this.router.navigate(['Inventory/editpurchasereturn', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deletePR(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this PR?',
      header: 'PR Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('PurchaseReturn', id).subscribe({
          next: () => {
            this.prList.update(prList => (prList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'PR Deleted Successfully', false);
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
  ApprovePR(id: string) {
    this.dataService.postAction<void>('PurchaseReturn/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'PR Approved Successfully', false);
        this.loadPR('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelPR(id: string) {
    this.dataService.postAction<void>('PurchaseReturn/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'PR Cancelled Successfully', false);
        this.loadPR('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  prStatusLabel(status: PurchaseReturnStatus): string {
    return PurchaseReturnStatus[status];
  }
  prFulfillmentStatusLabel(status: PurchaseReturnFulfillmentStatus): string {
    return PurchaseReturnFulfillmentStatus[status];
  }
  getPRStatusClass(status: PurchaseReturnStatus): string {
    switch (status) {
      case PurchaseReturnStatus.Draft:
        return 'status-draft';
      case PurchaseReturnStatus.Approved:
        return 'status-active';
      case PurchaseReturnStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }

}
