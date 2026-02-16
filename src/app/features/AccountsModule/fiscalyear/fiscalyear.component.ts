import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { form, FormField, required } from '@angular/forms/signals';
import { BaseApiService } from '../../../services/base-api.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { CreateFiscalYear } from '../../../Models/Accouting/FiscalYear.model';
import { FormsModule } from '@angular/forms';
import { FieldErrorSComponent } from '../../../shared/field-error-s/field-error-s.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-fiscalyear',
  imports: [DatePickerModule, FloatLabelModule, InputTextModule, FormField, FormsModule, FieldErrorSComponent],
  templateUrl: './fiscalyear.component.html',
  styleUrl: './fiscalyear.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiscalyearComponent {

  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);
  private destroyRef= inject(DestroyRef);
  submit = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});

  //Signal Model For FormData
  fiscalYearModel = signal<CreateFiscalYear>({
    year:0,
    yearDate: null,
    remarks: ''
  })

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
    console.log("Coming here!");
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    if(this.fiscalYearForm().invalid()){
      this.fiscalYearForm().markAsTouched();
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue= this.fiscalYearForm().value() as CreateFiscalYear;
    formvalue.year=formvalue.yearDate? formvalue.yearDate.getFullYear():new Date().getFullYear();
    console.log("Form Value: ",formvalue);

    //Making Api Call
    this.dataService.create<CreateFiscalYear>('FiscalYear',formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ()=>{
        this.base.globalMessage('success', 'FiscalYear Added Successfully');
          this.fiscalYearForm().reset();
          this.submit.set(false);
      },
       error: (err) => {
        console.log("Backend Errors: ",err.error.errors);
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
}
