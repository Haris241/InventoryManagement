import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { BaseApiService } from '../../services/base-api.service';
import { Register } from '../../Models/Auth.model';


@Component({
  selector: 'app-register',
  imports: [InputTextModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder)
  private api = inject(BaseApiService)
  submit = false;
  err:string[]=[];

register: FormGroup = this.fb.group({
  email: ['', Validators.required],
  userName: ['', Validators.required],
  password: ['', Validators.required],
  confirmPassword: ['', Validators.required],
  phoneNo: [null],
  name: [null]
});
registerUser(){
  this.submit=true;
  this.err=[];
  if(this.register.invalid){
    this.register.markAllAsTouched();
    return;
  }
  const pass = this.register.get('password')?.value;
  const confpass = this.register.get('confirmPassword')?.value;
  if(pass !== confpass){
    this.err=['Passwords do not Match'];
    return;
  }
  this.api.create<Register>("Auth/register",this.register.value).subscribe({
    next:()=>{
      this.submit=false;
      this.err=['User Register Successfully'];
    },
    error:(err)=>{
      if(err.status !== 0 && err.status<500){
        this.err=err.error.errors;
        this.submit = false;
      }
    }
  });
}
}
