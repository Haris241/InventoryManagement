import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { BaseApiService } from '../../../services/base-api.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { SalesWorkflowDto } from '../../../Models/ClientSetting.model';

@Component({
  selector: 'app-sales-workflow',
  imports: [CommonModule, FormField, InputTextModule, FormsModule],
  templateUrl: './sales-workflow.component.html',
  styleUrl: './sales-workflow.component.css',
})
export class SalesWorkflowComponent {
  private readonly destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);



  //Initialize
  ngOnInit() {
    this.loadSalesWorkflow();

  }

  //Load Sales Workflow Data
  loadSalesWorkflow() {
    this.dataService.getAll<SalesWorkflowDto>('ClientSetting/sales-workflow').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: SalesWorkflowDto) => {
        this.salesWorkflowModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  //Form
  private readonly initialModel: SalesWorkflowDto = {
    id: '',
    enableNegativeStock: false,
  };
  //Signal Model For FormData
  salesWorkflowModel = signal<SalesWorkflowDto>({ ...this.initialModel });


  // Signal form with validation schema
  salesWorkflowForm = form(this.salesWorkflowModel, (schemaPath) => {
  });


  //Update Sales Workflow
  updateSalesWorkflow(event: Event) {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    this.errors.set([]);

    const formvalue = this.salesWorkflowForm().value() as SalesWorkflowDto;

    this.dataService.edit('ClientSetting/sales-workflow', formvalue.id, formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.base.globalMessage('success', 'Sales Workflow Updated Successfully', false);
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.submit.set(false);
      }
    });
  }
  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof SalesWorkflowDto>(field: K, value: SalesWorkflowDto[K]) {
    this.salesWorkflowModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

}
