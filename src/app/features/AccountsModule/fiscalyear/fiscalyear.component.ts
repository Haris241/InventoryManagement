import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { form, FormField, required } from '@angular/forms/signals';
import { BaseApiService } from '../../../services/base-api.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { CloseYearRequest, CloseYearResponse, CreateFiscalYear, FiscalYearList, FiscalYearStatus, SwitchYearRequest } from '../../../Models/Accouting/FiscalYear.model';
import { FormsModule } from '@angular/forms';
import { FieldErrorSComponent } from '../../../shared/field-error-s/field-error-s.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaginationService } from '../../../services/pagination.service';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { NotificationType } from '../../../Models/Notification.model';

@Component({
  selector: 'app-fiscalyear',
  imports: [DatePickerModule, FloatLabelModule, InputTextModule, FormField, FormsModule, FieldErrorSComponent, TableModule, CommonModule],
  templateUrl: './fiscalyear.component.html',
  styleUrl: './fiscalyear.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiscalyearComponent {

  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private pagination = inject(PaginationService);
  private notifState = inject(NotificationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  fiscalYears = signal<FiscalYearList[]>([]);
  totalrecords = signal<number>(0);
  FiscalYearStatus = FiscalYearStatus;
  lastLazyEvent: TableLazyLoadEvent | null = null;
  closingMessage = signal<string>('');
  closingJobId = signal<string | null>(null);

  private readonly initialModel: CreateFiscalYear = {
    year: 0,
    yearDate: null,
    remarks: ''
  };

  //Signal Model For FormData
  fiscalYearModel = signal<CreateFiscalYear>({ ...this.initialModel });

  // Signal form with validation schema
  fiscalYearForm = form(this.fiscalYearModel, (schemaPath) => {
    required(schemaPath.yearDate, { message: 'Year is required' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CreateFiscalYear>(field: K, value: CreateFiscalYear[K]) {
    this.fiscalYearModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  //Creating Fiscal Year
  createFiscalYear(event: Event) {
    if (this.submit()) {
      return;
    }

    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.fiscalYearForm().invalid()) {
      this.fiscalYearForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.fiscalYearForm().value() as CreateFiscalYear;
    formvalue.year = formvalue.yearDate ? formvalue.yearDate.getFullYear() : new Date().getFullYear();

    //Making Api Call
    this.dataService.createResponse<CreateFiscalYear, FiscalYearList>('FiscalYear', formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.base.globalMessage('success', 'FiscalYear Added Successfully', false);
        this.fiscalYearForm().reset({ ...this.initialModel });
        if (this.lastLazyEvent) {
          this.loadFiscalYears(this.lastLazyEvent);
        }
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        console.log("Backend Errors: ", err.error.errors);
        if (err.error.errors) {
          this.backendErrors.set(err.error.errors);
          this.submit.set(false);
        } else {
          this.base.handleError(err, err.error.message);
          this.submit.set(false);
        }
      }
    });

  }

  //Loading Fiscal Year List
  loadFiscalYears(event: TableLazyLoadEvent) {
    this.lastLazyEvent = event;
    this.pagination.getDataWithoutForm<FiscalYearList>('FiscalYear/GetAll', event).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.fiscalYears.set(result.data);
        this.totalrecords.set(result.total);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    })
  }

  //FiscalYear Status
  getStatusClass(status: FiscalYearStatus): string {
    switch (status) {
      case FiscalYearStatus.Open:
        return 'status-active';
      case FiscalYearStatus.Closed:
        return 'status-closed';
      case FiscalYearStatus.NeedReClosure:
        return 'status-reclosure';
      default:
        return '';
    }
  }

  getStatusLabel(status: FiscalYearStatus): string {
    return FiscalYearStatus[status];
  }

  //Change Fiscal Year
  SwitchYear(requestedId: SwitchYearRequest) {
    console.log("ID ", requestedId);
    this.dataService.create<SwitchYearRequest>('FiscalYear/SwitchYear', requestedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.base.globalMessage('success', 'FiscalYear Changed Successfully', false);
        const defaulId = res.id;
        this.fiscalYears.update(list =>
          list.map(fy => ({
            ...fy, isDefault: fy.id === defaulId
          })));
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  //Close Fiscal Year
  closeYear(requestedId: CloseYearRequest) {

    this.dataService.createResponse<CloseYearRequest, CloseYearResponse>('FiscalYear/CloseYear', requestedId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.closingJobId.set(res.jobId);
        this.closingMessage.set("Fiscal year closing has been started. Check notifications for the final result.");
        // Listen for THIS specific job's result
        const sub = this.notifState.onJobComplete(res.jobId, (envelope) => {
          if (envelope.type === NotificationType.Success) {
            if (this.lastLazyEvent) {
              this.loadFiscalYears(this.lastLazyEvent);
            }
          }
          sub.unsubscribe(); // stop listening after result arrives
        });
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }
}
