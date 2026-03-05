import { Component, computed, input, Signal } from '@angular/core';
import { retry } from 'rxjs';

@Component({
  selector: 'app-field-errorS',
  imports: [],
  templateUrl: './field-error-s.component.html',
  styleUrl: './field-error-s.component.css',
})
export class FieldErrorSComponent {
  field = input.required<any>();

  // Backend errors from your parent component
  backendErrors = input.required<Record<string, string[]>>();
  // Signal indicating if the form was submitted
  submit = input<boolean>(false);

  frontendError = computed(() => {
    const state = this.field()(); // Get the current field state

    const isSubmit = this.submit();
    const isTouched = state.touched();
    const isInvalid = state.invalid();

    if ((isSubmit || isTouched) && isInvalid) {
      const errorsList = state.errors();

      if (!errorsList || errorsList.length === 0) {
        return 'Invalid input';
      }
      const firstError = errorsList[0];
      return firstError.message ?? firstError.name;
    }

    return null;
  });
  backendErrorList = computed(() => {
    const errors = this.backendErrors();
    if (!errors) return [];
    const key = this.field()().keyInParent();
    if (!key) return [];
    return errors[key] ?? [];
  });


}
