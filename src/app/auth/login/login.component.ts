
import { Component, inject, signal, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { Login, LoginResponse } from '../../Models/Auth.model';
import { DataLayerService } from '../../services/data-layer.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { FieldErrorSComponent } from '../../shared/field-error-s/field-error-s.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SignalIrService } from '../../services/signal-ir.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, FormsModule, FormField, RouterLink, FloatLabelModule, FieldErrorSComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private api = inject(BaseApiService)
  private dataService = inject(DataLayerService)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef);

  submit = signal<boolean>(false);
  showPassword = false;
  err = '';
  backendErrors = signal<Record<string, string[]>>({});
  formChange = signal<number>(0);

  loginModel = signal<Login>({
    userName: '',
    password: ''
  });

  loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.userName, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  userlogin() {
    this.err = '';
    this.submit.set(true);
    if (this.loginForm().invalid()) {
      this.loginForm().markAsTouched();
      return;
    }

    const newlogin = this.loginForm().value() as Login;
    this.dataService.createResponse<Login, LoginResponse>("Auth/login", newlogin)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submit.set(false);
          this.api.setToken(response.accessToken);
          this.router.navigate(['/modules']);
        },
        error: (err) => {
          if (err.error.errors) {
            this.backendErrors.set(err.error.errors);
            this.submit.set(false);
          } else {
            this.api.handleError(err, err.error.message);
            this.submit.set(false);
          }
          if (err.status !== 0 && err.status < 500) {
            this.err = "Login Failed! Invalid Credentials";
            this.submit.set(false);
          }
        }
      });
  }

  tooglePassword() {
    this.showPassword = !this.showPassword;
  }
}

