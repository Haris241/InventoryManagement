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
import { GRNFulfillmentStatus, GRNList, GRNSearch, GRNSourceModule, GRNStatus } from '../../../../Models/Inventory/GRN.model';

@Component({
  selector: 'app-grn-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule],
  templateUrl: './grn-list.component.html',
  styleUrl: './grn-list.component.css',
})
export class GrnListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  grnList = signal<GRNList[]>([]);
  grnSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/GRNList');
  grnSearchList = this.grnSearch.result;
  SupplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  SupplierSearchSearchList = this.SupplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  grnStatus = GRNStatus;
  grnFulfillmentStatus = GRNFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  grnStatusOptions = signal(enumToOptions(GRNStatus, true));
  grnFulfillmentStatusOptions = signal(enumToOptions(GRNFulfillmentStatus, true));
  grnSourceModuleOptions = signal(enumToOptions(GRNSourceModule, true));


  //Model For FormData
  private readonly initialModel: GRNSearch = {
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
  grnFormModel = signal<GRNSearch>({ ...this.initialModel });

  // Signal form with validation schema
  grnForm = form(this.grnFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof GRNSearch>(field: K, value: GRNSearch[K]) {
    this.grnFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadGRN(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.grnForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<GRNList, GRNSearch>('GRN/GetAll', payload).subscribe({
      next: (result) => {
        this.grnList.set(result.data);
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
    this.loadGRN('fresh');
  }

  editGRN(id: string) {
    this.router.navigate(['Inventory/editgrn', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deleteGRN(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this GRN?',
      header: 'GRN Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('GRN', id).subscribe({
          next: () => {
            this.grnList.update(grnList => (grnList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'GRN Deleted Successfully', false);
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
  ApproveGRN(id: string) {
    this.dataService.postAction<void>('GRN/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'GRN Approved Successfully', false);
        this.loadGRN('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelGRN(id: string) {
    this.dataService.postAction<void>('GRN/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'GRN Cancelled Successfully', false);
        this.loadGRN('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  grnStatusLabel(status: GRNStatus): string {
    return GRNStatus[status];
  }
  grnFulfillmentStatusLabel(status: GRNFulfillmentStatus): string {
    return GRNFulfillmentStatus[status];
  }
  getGRNStatusClass(status: GRNStatus): string {
    switch (status) {
      case GRNStatus.Draft:
        return 'status-draft';
      case GRNStatus.Approved:
        return 'status-active';
      case GRNStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
