import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseApiService } from '../../../../services/base-api.service';
import { DataLayerService } from '../../../../services/data-layer.service';
import { UpdateCOAGET, UpdateCOAPOST } from '../../../../Models/Accouting/ChartOfAccount.model';
import { form, FormField, required } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { FieldErrorSComponent } from "../../../../shared/field-error-s/field-error-s.component";
import { FloatLabel } from "primeng/floatlabel";
import { InputTextModule } from "primeng/inputtext";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coa-edit',
  imports: [CommonModule, FormField, FieldErrorSComponent, FloatLabel, InputTextModule, FormsModule],
  templateUrl: './coa-edit.component.html',
  styleUrl: './coa-edit.component.css',
})
export class CoaEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  coaId = signal<string>('');
  backendErrors = signal<Record<string, string[]>>({});
  coaDetail = signal<UpdateCOAGET | null>(null);

  //Form
  private readonly initialModel: UpdateCOAPOST = {
    name: '',
    deactivateChildren: false,
    isActive: true
  };
  //Signal Model For FormData
  coaEditModel = signal<UpdateCOAPOST>({ ...this.initialModel });


  // Signal form with validation schema
  coaEditForm = form(this.coaEditModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
  });

  //Initialize
  ngOnInit() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {
          this.loadCOA(id);
        }
      });
  }

  //Load COA Data
  loadCOA(id: string) {
    this.dataService.getById<UpdateCOAGET>('COA', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: UpdateCOAGET) => {
        this.coaId.set(id);
        this.coaDetail.set(data);
        this.coaEditModel.set({
          name: data.name,
          isActive: data.isActive,
          deactivateChildren: false
        });
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  //Update COA
  updateCOA(event: Event) {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.coaEditForm().invalid()) {
      this.coaEditForm().markAsTouched();
      this.submit.set(false);
      return;
    }
    const formvalue = this.coaEditForm().value() as UpdateCOAPOST;
    this.dataService.edit('COA', this.coaId(), formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.base.globalMessage('success', 'Chart Of Account Updated Successfully', false);
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.submit.set(false);
      }
    });
  }
}
