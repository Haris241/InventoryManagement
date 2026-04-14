import { Component, DestroyRef, inject, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { CurrencyDto, Month, Register } from '../../Models/Auth.model';
import { DataLayerService } from '../../services/data-layer.service';
import { BaseApiService } from '../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { FieldErrorSComponent } from '../../shared/field-error-s/field-error-s.component';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { enumToOptions } from '../../shared/Utility';

@Component({
  selector: 'app-register',
  imports: [InputTextModule, FormsModule, FormField, RouterLink, FloatLabelModule, FieldErrorSComponent, SelectModule, DatePickerModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private dataService = inject(DataLayerService);
  private base = inject(BaseApiService);
  private destroyRef = inject(DestroyRef);

  currencies = signal<CurrencyDto[]>([]);
  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  showPassword = false;
  showConfirmPassword = false;
  backendErrors = signal<Record<string, string[]>>({});
  monthsDropdown = signal(enumToOptions(Month, true));
  err: string[] = [];

  private readonly initialModel: Register = {
    email: '',
    userName: '',
    password: '',
    confirmPassword: '',
    phoneNo: '',
    name: '',
    fiscalStartMonth: null!,
    currencyCode: ''
  };
  registerModel = signal<Register>(this.initialModel);

  registerForm = form(this.registerModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Email is required' });
    required(schemaPath.userName, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
    required(schemaPath.confirmPassword, { message: 'Confirm Password is required' });
    required(schemaPath.phoneNo, { message: 'Phone No is required' });
    required(schemaPath.name, { message: 'Name is required' });
    required(schemaPath.fiscalStartMonth, { message: 'Fiscal Start Month is required' });
    required(schemaPath.currencyCode, { message: 'Currency is required' });
  });

  ngOnInit(): void {
    this.loadCurrencies();
  }

  loadCurrencies(): void {
    this.dataService.getAll<CurrencyDto[]>("Dropdowns/Currencies").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.currencies.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  registerUser(event: Event): void {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.registerForm().invalid()) {
      this.registerForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    this.backendErrors.set({});
    const formValue = this.registerForm().value() as Register;

    if (formValue.password !== formValue.confirmPassword) {
      this.err = ['Passwords do not match'];
      this.submit.set(false);
      return;
    }

    this.dataService.create<Register>("Auth/register", formValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.base.globalMessage('success', 'User Registered Successfully');
          this.submit.set(false);
          this.formSubmitted.set(false);
        },
        error: (err) => {
          if (err.status !== 0 && err.status < 500) {
            this.err = err.error.errors;
            this.submit.set(false);
          }
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  updateField(field: string, value: any): void {
    this.registerModel.update(m => ({ ...m, [field]: value }));
  }
}
