import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../../services/data-layer.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { PaginationService } from '../../../../services/pagination.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WareHouseDto, WarehouseLocationDto } from '../../../../Models/Inventory/WareHouse.model';
import { applyEach, form, FormField, required } from '@angular/forms/signals';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FieldErrorSComponent } from '../../../../shared/field-error-s/field-error-s.component';

@Component({
  selector: 'app-warehouse',
  imports: [FloatLabelModule, FieldErrorSComponent, FormsModule, InputTextModule, FormField],
  templateUrl: './warehouse.component.html',
  styleUrl: './warehouse.component.css',
})
export class WarehouseComponent {

  //properties
  private dataService = inject(DataLayerService);
  private destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  errors = signal<string[]>([]);
  isEditMode = signal<boolean>(false);

  //Load Voucher for Edit Mode
  ngOnInit() {
    this.activatedRoute.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef)).subscribe(param => {
        const id = param.get('id');
        if (id) {

          this.isEditMode.set(true);
          this.loadWareHouse(id);
        }
      });
  }



  //Initialize Lines
  private readonly locations: WarehouseLocationDto = {
    name: '',
    code: '',
    description: '',
    isActive: true
  };

  //Intialize Main Object
  private readonly wareHouseModel: WareHouseDto = {
    name: '',
    code: '',
    description: '',
    isActive: true,
    address: '',
    city: '',
    country: '',
    managerName: '',
    phone: '',
    locations: []
  };

  //Intialize Main Object with Signal
  warehouseModel = signal<WareHouseDto>(this.wareHouseModel);

  //validations
  warehouseForm = form(this.warehouseModel, (schema) => {
    // Root validations
    required(schema.name, { message: 'Name is required' });
    required(schema.code, { message: 'Code is required' });


    // Nested lines validation
    applyEach(schema.locations, (line) => {
      required(line.name, { message: 'Name is required' });
      required(line.code, { message: 'Code is required' });
    });
  });

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof WareHouseDto>(field: K, value: WareHouseDto[K]) {
    this.warehouseModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }
  // ✅ Update a specific field inside a specific line by index
  updateLineField<K extends keyof WarehouseLocationDto>(
    index: number,
    field: K,
    value: WarehouseLocationDto[K]
  ) {
    this.warehouseModel.update(prev => {
      const locations = [...prev.locations];           // shallow copy the array
      locations[index] = { ...locations[index], [field]: value }; // copy the line, update field
      return { ...prev, locations };
    });
  }

  // ✅ Add a new empty line
  addLine(): void {
    const locations = this.warehouseModel().locations;

    // No existing lines -> simply add the first one
    if (locations.length === 0) {
      this.warehouseModel.update(prev => ({
        ...prev,
        locations: [{ ...this.locations }]
      }));

      return;
    }

    // Validate the last existing line before adding another
    const index = locations.length - 1;
    const line = this.warehouseForm.locations[index];

    const isInvalid = line.name().invalid() || line.code().invalid();

    if (isInvalid) {
      line.name().markAsTouched();
      line.code().markAsTouched();
      return;
    }

    this.warehouseModel.update(prev => ({
      ...prev,
      locations: [...prev.locations, { ...this.locations }]
    }));
  }


  // ✅ Delete a line by index
  deleteLine(index: number): void {
    this.warehouseModel.update(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  }

  //Create method
  createWareHouse(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.warehouseForm().invalid()) {
      this.warehouseForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    this.errors.set([]);
    this.backendErrors.set({});
    const formvalue = this.warehouseForm().value() as WareHouseDto;

    //for update and create
    const url = `WareHouse`;
    const request$ = this.isEditMode()
      ? this.dataService.edit<WareHouseDto>(url, formvalue.id?.toString() ?? '', formvalue)
      : this.dataService.create<WareHouseDto>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        //Redirect To List For Edit
        if (this.isEditMode()) {
          this.router.navigate(['Inventory', 'warehouselist']);
          this.base.globalMessage('success', 'WareHouse Updated Successfully', false);
          return;
        }
        this.base.globalMessage('success', 'WareHouse Added Successfully', false);
        //Reset the form
        this.warehouseForm().reset({ ...this.wareHouseModel, locations: [] });
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


  loadWareHouse(id: string) {
    this.dataService.getById<WareHouseDto>('WareHouse', id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.warehouseModel.set(data);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.router.navigate(['Inventory', 'warehouselist']);
      }
    });
  }

}
