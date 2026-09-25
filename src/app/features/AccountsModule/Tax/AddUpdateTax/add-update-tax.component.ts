import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { disabled, form, FormField, readonly, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';
import { PaginationService } from '../../../../services/pagination.service';
import { TaxDto } from '../../../../Models/Accouting/Tax.model';

@Component({
  selector: 'app-add-update-tax',
  imports: [FieldErrorSComponent, FormField, FormsModule, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './add-update-tax.component.html',
  styleUrl: './add-update-tax.component.css',
})
export class AddUpdateTaxComponent {
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  isEditMode = signal<boolean>(false);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);

  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadTax(id);
        }
      });
  }

  private readonly initialModel: TaxDto = {
    name: '',
    rate: 0,
    description: '',
    isRecoverable: false,
    isActive: true,
  };

  //Signal Model For FormData
  taxModel = signal<TaxDto>({ ...this.initialModel });


  // Signal form with validation schema
  taxForm = form(this.taxModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    validate(schemaPath.rate, ({ value }) => {
      const rate = value();
      if (rate == null || rate <= 0 || rate > 100) {
        return { kind: 'positiveRate', message: 'Rate must be between 0 and 100' };
      }
      return null;
    });

    //Make readonly
    readonly(schemaPath.name, () => this.isEditMode());
    readonly(schemaPath.rate, () => this.isEditMode());
    disabled(schemaPath.isRecoverable, () => this.isEditMode());
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof TaxDto>(field: K, value: TaxDto[K]) {
    this.taxModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }


  //Creating Tax
  createTax(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.taxForm().invalid()) {
      this.taxForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.taxForm().value() as TaxDto;

    //for update and create
    const url = `Tax`;
    const request$ = this.isEditMode() ?
      this.dataService.edit<TaxDto>(url, this.activatedRoute.snapshot.paramMap.get('id')!, formvalue)
      : this.dataService.create<TaxDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Accounts', 'taxList']);
          this.base.globalMessage('success', 'Tax Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'Tax Added Successfully', false);

        this.taxForm().reset({ ...this.initialModel });
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        if (err.error.errors) {
          this.backendErrors.set(err.error.errors);
        } else {
          this.base.handleError(err, err.error.message);
        }
        this.submit.set(false);
      }
    });

  }

  loadTax(id: string) {
    this.dataService.getById<TaxDto>('Tax', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.taxModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Accounts', 'taxList']);
      }
    });
  }
}
