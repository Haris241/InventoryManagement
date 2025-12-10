import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Input, Signal, WritableSignal } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  imports: [CommonModule],
  templateUrl: './field-error.component.html',
  styleUrl: './field-error.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldErrorComponent {
  @Input() form!: FormGroup;
  @Input() backendErrors!: WritableSignal<Record<string, string[]>>;
  @Input() field!:string;
  @Input() submit!: WritableSignal<boolean>;
  @Input() formChange!: WritableSignal<number>;


  frontendError= computed(()=>{
    const control = this.form.get(this.field);
    if(!control){
      return null;
    }
    this.formChange();

    if( (this.submit() || control.touched) && control.invalid){
      const errors = control.errors || {};
      if (errors['required']) return 'This field is required';
      if (errors['min']) return `Minimum value is ${errors['min'].min}`;
      if (errors['max']) return `Maximum value is ${errors['max'].max}`;
      if (errors['pattern']) return 'Invalid format';
      return 'Invalid Input'
    }

    return null;
  });

  backendErrorList=computed(()=>{
    this.formChange();
    console.log("Child: " ,this.backendErrors());
    return this.backendErrors()?.[this.field]??[];
  });
}
