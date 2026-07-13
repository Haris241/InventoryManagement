import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ClientSettingGetDTO, ClientSettingUpdateDTO } from '../../Models/ClientSetting.model';
import { form, FormField, required } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { DataLayerService } from '../../services/data-layer.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatLabel } from "primeng/floatlabel";
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FieldErrorSComponent } from '../field-error-s/field-error-s.component';
import { FormDataService } from '../../services/formData.service';

@Component({
  selector: 'app-client-setting',
  imports: [CommonModule, FormField, FieldErrorSComponent, FloatLabel, InputTextModule, FormsModule],
  templateUrl: './client-setting.component.html',
  styleUrl: './client-setting.component.css',
})
export class ClientSettingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private base = inject(BaseApiService);
  private dataService = inject(DataLayerService);
  private formservice = inject(FormDataService);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  backendErrors = signal<Record<string, string[]>>({});
  imagePreview = signal<string>('');
  selectedImage: File | null = null;



  //Initialize
  ngOnInit() {
    this.loadClientSetting();

  }

  //Load Client Setting Data
  loadClientSetting() {
    this.dataService.getAll<ClientSettingGetDTO>('ClientSetting').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: ClientSettingGetDTO) => {
        this.clientSettingModel.set(data);
        this.imagePreview.set(data.imagePath);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
      }
    });
  }

  //Form
  private readonly initialModel: ClientSettingUpdateDTO = {
    id: '',
    name: '',
    imagePath: ''
  };
  //Signal Model For FormData
  clientSettingModel = signal<ClientSettingUpdateDTO>({ ...this.initialModel });


  // Signal form with validation schema
  clientSettingForm = form(this.clientSettingModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Name is required' });
  });


  //Update Client Setting
  updateClientSetting(event: Event) {
    if (this.submit()) {
      return;
    }
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.clientSettingForm().invalid()) {
      this.clientSettingForm().markAsTouched();
      this.submit.set(false);
      return;
    }
    const formvalue = this.clientSettingForm().value() as ClientSettingUpdateDTO;
    if (this.selectedImage) {
      formvalue.imageFile = this.selectedImage;
    }
    const formdata = this.formservice.buildFormData(formvalue);
    this.dataService.edit('ClientSetting', formvalue.id, formdata).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.base.globalMessage('success', 'Client Setting Updated Successfully', false);
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.base.handleError(err, err.error?.message);
        this.submit.set(false);
      }
    });
  }
  onImageSelected(event: Event) {
    this.selectedImage = this.formservice.onImageSelected(event, this.imagePreview);
  }

  removeImage() {
    this.selectedImage = this.formservice.removeImage(this.imagePreview, 'clientLogo');
  }
}

