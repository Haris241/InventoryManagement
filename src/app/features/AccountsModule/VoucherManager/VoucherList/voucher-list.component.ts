import { Component, inject, signal, WritableSignal } from '@angular/core';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { Router } from '@angular/router';
import { DataLayerService } from '../../../../services/data-layer.service';
import { JournalEntryListDto, JournalEntrySearchDto, VoucherType } from '../../../../Models/Accouting/VoucherManager.model';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { enumToOptions, toDateOnlyString } from '../../../../shared/Utility';
import { form } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-voucher-list',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, DatePickerModule],
  templateUrl: './voucher-list.component.html',
  styleUrl: './voucher-list.component.css',
})
export class VoucherListComponent {
  base = inject(BaseApiService);
  router = inject(Router);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);


  voucherList = signal<JournalEntryListDto[]>([]);
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/VoucherAccounts');
  coaSearchList = this.coaSearch.result;
  voucherNoSearch = this.pagination.autoSearchDropdown<AutoDropdown>('Dropdowns/Vouchers');
  voucherNoSearchList = this.voucherNoSearch.result;

  //pagination signals
  hasNextPage = signal<boolean>(false);
  hasPreviousPage = signal<boolean>(false);
  nextCursor = signal<string | null>(null);
  previousCursor = signal<string | null>(null);
  isEditableType = new Set(['BankPayment', 'BankReceipt', 'Journal', 'Contra', 'CashPayment', 'CashReceipt']);
  isDeleteableType = new Set(['BankPayment', 'BankReceipt', 'Journal', 'Contra', 'CashPayment', 'CashReceipt']);

  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Dropdowns
  voucheTypes = signal(enumToOptions(VoucherType, true));

  //Model For FormData
  private readonly initialModel: JournalEntrySearchDto = {
    accountId: null,
    voucherId: null,
    voucherType: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null,
    nextCursor: null,
    previousCursor: null,
  };
  //Signal Model For FormData
  journalEntryModel = signal<JournalEntrySearchDto>({ ...this.initialModel });

  // Signal form with validation schema
  journalEntryForm = form(this.journalEntryModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof JournalEntrySearchDto>(field: K, value: JournalEntrySearchDto[K]) {
    this.journalEntryModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadVoucher(direction: 'next' | 'previous' | 'fresh' = 'fresh') {
    const formValue = this.journalEntryForm().value();
    const payload = {
      ...formValue,
      fromDate: toDateOnlyString(formValue.fromDateUI),
      toDate: toDateOnlyString(formValue.toDateUI),
      nextCursor: direction === 'next' ? this.nextCursor() : null,
      previousCursor: direction === 'previous' ? this.previousCursor() : null
    };
    this.pagination.getDataCursor<JournalEntryListDto, JournalEntrySearchDto>('VoucherManager/GetAll', payload).subscribe({
      next: (result) => {
        this.voucherList.set(result.data);
        this.hasNextPage.set(result.hasNextPage);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(result.previousCursor ?? null);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message, false);
      }
    })
  }
  OnSearch() {
    this.nextCursor.set(null);
    this.previousCursor.set(null);
    this.loadVoucher('fresh');
  }

  editVoucher(id: string, voucherType: string) {
    switch (voucherType) {
      case 'Journal':
        this.router.navigate(['Accounts', 'jvEdit', id]);
        break;

      case 'CashPayment':
        this.router.navigate(['Accounts', 'cpvEdit', id]);
        break;

      case 'BankPayment':
        this.router.navigate(['Accounts', 'bpvEdit', id]);
        break;

      case 'CashReceipt':
        this.router.navigate(['Accounts', 'crvEdit', id]);
        break;

      case 'BankReceipt':
        this.router.navigate(['Accounts', 'brvEdit', id]);
        break;

      case 'Contra':
        this.router.navigate(['Accounts', 'cvEdit', id]);
        break;
    }
  }
  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

  deleteVoucher(id: string) {
    this.confirmation.confirm({
      message: 'Are you sure you want to delete this Voucher?',
      header: 'Voucher Delete Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.dataService.delete<void>('VoucherManager', id).subscribe({
          next: () => {
            this.voucherList.update(vouchers => (vouchers.filter(p => p.id !== Number(id))));
            this.base.globalMessage('success', 'Voucher Deleted Successfully', false);
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

}
