import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { AccountKind, AccountType, COADropdownDto, CreateCOA } from '../../../../Models/Accouting/ChartOfAccount.model';
import { form, FormField, required, min } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { enumToOptions } from '../../../../shared/Utility';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';


@Component({
  selector: 'app-chart-of-account',
  imports: [FormField, FormsModule, FieldErrorSComponent, FloatLabelModule, InputTextModule, SelectModule],
  templateUrl: './chart-of-account.component.html',
  styleUrl: './chart-of-account.component.css',
})
export class ChartOfAccountComponent {

  //load COA Lis when user comes to page
  constructor() {
    this.dataService.getAllSimple<COADropdownDto>('Dropdowns/COAList').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        const formatted = res.map(acc => ({ ...acc, displayName: `${' - '.repeat(acc.level)}${acc.name}` }));
        this.coaList.set(formatted);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  isLedger = computed(() => this.coaForm.kind().value() === AccountKind.Ledger);

  //Dropdowns
  accoundKind = signal(enumToOptions(AccountKind, true));
  accountType = signal(enumToOptions(AccountType, true));
  coaList = signal<COADropdownDto[]>([]);

  private readonly initialModel: CreateCOA = {
    name: '',
    parentId: null,
    kind: null,
    category: null,
    openingBalance: 0
  };
  //Signal Model For FormData
  coaModel = signal<CreateCOA>({ ...this.initialModel });


  // Signal form with validation schema
  coaForm = form(this.coaModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.parentId, { message: 'Parent is required' });
    required(schemaPath.kind, { message: 'Kind is required' });
    required(schemaPath.category, { message: 'Category is required' });
    min(schemaPath.openingBalance, 0, { message: 'Opening Balance must be greater than 0' });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CreateCOA>(field: K, value: CreateCOA[K]) {
    this.coaModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  //Update category based on Parent
  onParentChange(parentId: number | null) {
    this.updateField('parentId', parentId);

    const parent = this.coaList().find(c => c.id === parentId);

    if (parent?.category) {
      this.updateField('category', parent.category);
    }
  }

  //Creating COA
  createCOA(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.coaForm().invalid()) {
      this.coaForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.backendErrors.set({});
    const formvalue = this.coaForm().value() as CreateCOA;

    //Making Api Call
    this.dataService.createResponse<CreateCOA, COADropdownDto>('COA', formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (newAccount) => {
        this.base.globalMessage('success', 'Chart Of Account Added Successfully');

        //Append the list without hitting db for Groups
        if (formvalue.kind == AccountKind.Group) {
          const formatted = { ...newAccount, displayName: `${' - '.repeat(newAccount.level)}${newAccount.name}` };

          this.coaList.update(list => {
            const parentIndex = list.findIndex(x => x.id === formatted.parentId);

            if (parentIndex === -1) {
              return [...list, formatted]; // fallback
            }

            const parentLevel = list[parentIndex].level;
            let insertAt = parentIndex + 1;

            // skip all existing descendants of parent
            while (insertAt < list.length && list[insertAt].level > parentLevel) {
              insertAt++;
            }

            const updated = [...list];
            updated.splice(insertAt, 0, formatted);
            return updated;
          });
        }

        this.coaForm().reset({ ...this.coaModel(), name: '', openingBalance: 0 });
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

}
