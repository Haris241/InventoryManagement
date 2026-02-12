
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterLink } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { Login, LoginResponse } from '../../Models/Auth.model';
import { DataLayerService } from '../../services/data-layer.service';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FieldErrorComponent } from '../../shared/field-error/field-error.component';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, ReactiveFormsModule, RouterLink, FloatLabelModule,FieldErrorComponent,SelectModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  private api = inject(BaseApiService)
  private dataService = inject(DataLayerService)
  private router = inject(Router)
  submit = signal<boolean>(false);
  showPassword = false;
  err = '';
  backendErrors = signal<Record<string, string[]>>({});
  formChange = signal<number>(0);

  login: FormGroup = this.fb.group({
    userName: ['', Validators.required],
    password: ['', Validators.required]
  });
  userlogin() {
    this.err = '';
    this.submit.set(true);
    if (this.login.invalid) {
      this.login.markAllAsTouched();
      return;
    }
    const newlogin: Login = this.login.value
    this.dataService.createResponse<Login, LoginResponse>("Auth/login", newlogin).subscribe({
      next: (response) => {
        this.submit.set(false);
        this.api.setToken(response.accessToken);
        this.router.navigate(['/modules']);
      },
      error: (err) => {
        console.log("Errors: ", err.error.errors);
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
function takeUntilDestroyed(): import("rxjs").OperatorFunction<any, unknown> {
  throw new Error('Function not implemented.');
}

