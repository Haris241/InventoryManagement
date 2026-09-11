import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatLabel } from "primeng/floatlabel";
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { BaseApiService } from '../../../services/base-api.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { FieldErrorSComponent } from '../../../shared/field-error-s/field-error-s.component';
import { InventoryWorkflowDto, VoucherPostingPoint } from '../../../Models/Notification.model';
import { enumToOptions } from '../../../shared/Utility';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-inventoryworlflow',
  imports: [CommonModule, FormField, SelectModule, FieldErrorSComponent, FloatLabel, InputTextModule, FormsModule],
  templateUrl: './inventoryworlflow.component.html',
  styleUrl: './inventoryworlflow.component.css',
})
export class InventoryworlflowComponent {
  private readonly destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  postingPointList = signal(enumToOptions(VoucherPostingPoint, true));
  errors = signal<string[]>([]);



  //Initialize
  ngOnInit() {
    this.loadInventoryWorkflow();

  }

  //Load Client Setting Data
  loadInventoryWorkflow() {
    this.dataService.getAll<InventoryWorkflowDto>('ClientSetting/inventory-workflow').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: InventoryWorkflowDto) => {
        this.inventoryWorkflowModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  //Form
  private readonly initialModel: InventoryWorkflowDto = {
    id: '',
    enableDemand: false,
    enableGateEntry: false,
    enableGRN: false,
    enableOutwardGatePass: false,
    enableInternalMovement: false,
    requirePOForGRN: false,
    postingPoint: VoucherPostingPoint.ManualInvoice
  };
  //Signal Model For FormData
  inventoryWorkflowModel = signal<InventoryWorkflowDto>({ ...this.initialModel });


  // Signal form with validation schema
  inventoryWorkflowForm = form(this.inventoryWorkflowModel, (schemaPath) => {
    required(schemaPath.postingPoint, { message: 'Posting Point is required' });
  });


  //Update Inventory Workflow
  updateInventoryWorkflow(event: Event) {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    this.errors.set([]);
    var validationError = this.validateInventoryWorkflow(this.inventoryWorkflowForm().value());

    if (validationError) {
      this.errors.set([validationError]);
      this.submit.set(false);
      return;
    }
    const formvalue = this.inventoryWorkflowForm().value() as InventoryWorkflowDto;

    this.dataService.edit('ClientSetting/inventory-workflow', formvalue.id, formvalue).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.base.globalMessage('success', 'Inventory Workflow Updated Successfully', false);
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
  updateField<K extends keyof InventoryWorkflowDto>(field: K, value: InventoryWorkflowDto[K]) {
    this.inventoryWorkflowModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  //Validation
  validateInventoryWorkflow(s: InventoryWorkflowDto): string | null {
    // 1. Gate Entry requires GRN
    if (s.enableGateEntry && !s.enableGRN) {
      return 'Gate Entry requires GRN to be enabled.';
    }

    // 2. Posting at Purchase requires GRN and Gate Entry to be disabled
    if (s.postingPoint === VoucherPostingPoint.Purchase && (s.enableGRN || s.enableGateEntry)) {
      return 'Posting at Purchase requires GRN and Gate Entry to be disabled.';
    }

    // 3. Posting at GRN requires GRN to be enabled
    if (s.postingPoint === VoucherPostingPoint.GRN && !s.enableGRN) {
      return 'Posting at GRN requires GRN to be enabled.';
    }

    return null;
  }

}
