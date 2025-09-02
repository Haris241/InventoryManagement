import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-register',
  imports: [InputTextModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder)
  submit = false;

login: FormGroup = this.fb.group({
  email: ['', Validators.required],
  userName: ['', Validators.required],
  password: ['', Validators.required],
  confirmPassword: ['', Validators.required]
});
}
