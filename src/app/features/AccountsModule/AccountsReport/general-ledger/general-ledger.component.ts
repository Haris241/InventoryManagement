import { Component, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { GeneralLederSearch, GeneralLedgerData } from '../../../../Models/Accouting/AccountReports.model';
import { form, required } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { COAList } from '../../../../Models/Accouting/ChartOfAccount.model';
import { AutoDropdown } from '../../../../Models/Pagination.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldErrorSComponent } from "../../../../shared/field-error-s/field-error-s.component";

@Component({
  selector: 'app-general-ledger',
  imports: [TableModule, AutoCompleteModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, DatePickerModule, FieldErrorSComponent],
  templateUrl: './general-ledger.component.html',
  styleUrl: './general-ledger.component.css',
})
export class GeneralLedgerComponent {

  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);

  coaList = signal<COAList[]>([]);
  coaSearch = this.pagination.autoSearchDropdown<AutoDropdown>('AccountsDropDown/VoucherAccounts');
  coaSearchList = this.coaSearch.result;

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  generalLedgerData = signal<GeneralLedgerData | null>(null);


  //Model For FormData
  private readonly initialModel: GeneralLederSearch = {
    accountId: null,
    fromDate: null,
    toDate: null,
    fromDateUI: null,
    toDateUI: null
  };
  //Signal Model For FormData
  generalLedgerModel = signal<GeneralLederSearch>({ ...this.initialModel });

  // Signal form with validation schema
  generalLedgerForm = form(this.generalLedgerModel, (schema) => {
    // Root validations
    required(schema.accountId, { message: 'Account is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof GeneralLederSearch>(field: K, value: GeneralLederSearch[K]) {
    this.generalLedgerModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadGeneralLedger(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.generalLedgerForm().invalid()) {
      this.generalLedgerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.generalLedgerForm().value() as GeneralLederSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    //for update and create
    const url = `AccountsReports/GeneralLedgerList`;
    const request$ = this.dataService.createResponse<GeneralLederSearch, GeneralLedgerData>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.generalLedgerData.set(result);
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.submit.set(false);
        if (err.error?.errors) {
          this.backendErrors.set(err.error.errors);
        } else {
          this.base.handleError(err, err.error?.message, false);
        }
      }
    });
  }

  //On Search
  OnSearch(event: Event) {
    this.loadGeneralLedger(event);
  }
  GeneralLedgerReport() {
    if (this.generalLedgerForm().invalid()) {
      this.generalLedgerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.generalLedgerForm().value() as GeneralLederSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI);
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI);

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/GeneralLedgerReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `GeneralLedgerReport.pdf`);
          this.submit.set(false);
          this.formSubmitted.set(false);

        },
        error: (err) => {
          this.submit.set(false);
          if (newTab) newTab.close();
          this.base.handleError(err, err.error?.message);
        }
      });

  }

  SearchDropDown(event: { query: string }, searchtermsignal: WritableSignal<string>) {
    const search = event.query?.trim() ?? '';
    if (search.length > 2) {
      searchtermsignal.set(search);
    }
  }

}
