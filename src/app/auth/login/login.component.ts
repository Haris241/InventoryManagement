
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterLink } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { Login, LoginResponse } from '../../Models/Auth.model';

@Component({
  selector: 'app-login',
  imports: [InputTextModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  private api= inject(BaseApiService)
  private router = inject(Router)
  submit = false;
  showPassword = false;
  err='';

login: FormGroup = this.fb.group({
  userName: ['', Validators.required],
  password: ['', Validators.required]
});
userlogin(){
  this.err='';
  this.submit=true;
  if(this.login.invalid){
    this.login.markAllAsTouched();
    return;
  }
  const newlogin: Login = this.login.value
  this.api.createResponse<Login,LoginResponse>("Auth/login",newlogin).subscribe({
    next: (response) => {
      this.submit = false;
      this.api.setToken(response.accessToken, response.refreshToken);
      this.router.navigate(['/Inventory/dashboard']);
    },
    error:(err)=>{
      if(err.status !== 0 && err.status < 500){
        this.err="Login Failed! Invalid Credentials";
        this.submit=false;
      }
    }
  });
}
tooglePassword(){
  this.showPassword = !this.showPassword;
}

}
