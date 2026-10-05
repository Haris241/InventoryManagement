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
import { GateEntryFulfillmentStatus, GateEntryList, GateEntrySearch, GateEntrySourceModule, GateEntryStatus } from '../../../../Models/Inventory/GateEntry.model';

@Component({
  selector: 'app-gate-entry-list',
  imports: [DatePickerModule, TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule],
  templateUrl: './gate-entry-list.component.html',
  styleUrl: './gate-entry-list.component.css',
})
export class GateEntryListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);

  geList = signal<GateEntryList[]>([]);
  geSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/GateEntryList');
  geSearchList = this.geSearch.result;
  SupplierSearch = this.pagination.autoSearchDropdown<AutoDropdown>('DropDowns/SuppliersList');
  SupplierSearchSearchList = this.SupplierSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);

  geStatus = GateEntryStatus;
  geFulfillmentStatus = GateEntryFulfillmentStatus;

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  geStatusOptions = signal(enumToOptions(GateEntryStatus, true));
  geFulfillmentStatusOptions = signal(enumToOptions(GateEntryFulfillmentStatus, true));
  geSourceModuleOptions = signal(enumToOptions(GateEntrySourceModule, true));


  //Model For FormData
  private readonly initialModel: GateEntrySearch = {
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
  geFormModel = signal<GateEntrySearch>({ ...this.initialModel });

  // Signal form with validation schema
  geForm = form(this.geFormModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof GateEntrySearch>(field: K, value: GateEntrySearch[K]) {
    this.geFormModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadGE(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.geForm().value();
    this.formSubmitted.set(true);

    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };

    this.pagination.getDataCursor<GateEntryList, GateEntrySearch>('GateEntry/GetAll', payload).subscribe({
      next: (result) => {
        this.geList.set(result.data);
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
    this.loadGE('fresh');
  }

  editGE(id: string) {
    this.router.navigate(['Inventory/editgateentry', id]);
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 0) {
      searchtermsignal.set(search);
    }
  }
  deleteGE(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Gate Entry?',
      header: 'Gate Entry Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Ok',
      rejectLabel: 'Cancel',
      accept: () => {
        this.dataService.delete<void>('GateEntry', id).subscribe({
          next: () => {
            this.geList.update(geList => (geList.filter(p => p.id !== id)));
            this.base.globalMessage('success', 'Gate Entry Deleted Successfully', false);
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
  ApproveGE(id: string) {
    this.dataService.postAction<void>('GateEntry/approve', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Gate Entry Approved Successfully', false);
        this.loadGE('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  CancelGE(id: string) {
    this.dataService.postAction<void>('GateEntry/cancel', id).subscribe({
      next: () => {
        this.base.globalMessage('success', 'Gate Entry Cancelled Successfully', false);
        this.loadGE('fresh');
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }
  geStatusLabel(status: GateEntryStatus): string {
    return GateEntryStatus[status];
  }
  geFulfillmentStatusLabel(status: GateEntryFulfillmentStatus): string {
    return GateEntryFulfillmentStatus[status];
  }
  getGEStatusClass(status: GateEntryStatus): string {
    switch (status) {
      case GateEntryStatus.Draft:
        return 'status-draft';
      case GateEntryStatus.Approved:
        return 'status-active';
      case GateEntryStatus.Cancelled:
        return 'status-closed';
      default:
        return '';
    }
  }
}
