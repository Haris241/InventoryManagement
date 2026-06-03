import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { retry } from 'rxjs';

@Component({
  selector: 'app-field-errorS',
  imports: [],
  templateUrl: './field-error-s.component.html',
  styleUrl: './field-error-s.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FieldErrorSComponent {
  field = input.required<any>();

  // Backend errors from your parent component
  backendErrors = input.required<Record<string, string[]>>();
  // Signal indicating if the form was submitted
  submit = input<boolean>(false);
  //for lines Error
  fieldPath = input<string | null>(null);

  frontendError = computed(() => {
    const fieldSignal = this.field();

    // Safety check: Ensure the field passed is actually a function/signal
    if (typeof fieldSignal !== 'function') {
      return null;
    }

    const state = fieldSignal(); // Now safe to call
    const isSubmit = this.submit();
    const isTouched = state.touched?.() ?? false;
    const isInvalid = state.invalid?.() ?? false;

    if ((isSubmit || isTouched) && isInvalid) {
      const errorsList = state.errors?.();
      if (!errorsList || errorsList.length === 0) return 'Invalid input';

      const firstError = errorsList[0];
      return firstError.message ?? firstError.name;
    }

    return null;
  });
  backendErrorList = computed(() => {
    const errors = this.backendErrors();
    const fieldSignal = this.field();

    // 1. Check if the dictionary exists
    if (!errors) return [];

    // 2. Safety check for the field signal
    if (typeof fieldSignal !== 'function') return [];

    //For Lines
    const path = this.fieldPath();

    if (path) {
      return errors[path] ?? [];
    }

    // 3. Execute the signal to get the state object
    const state = fieldSignal();

    // 4. Get the key (using optional chaining for safety)
    const key = state?.keyInParent?.();

    if (!key) return [];

    // 5. Return the specific errors for this key
    return errors[key] ?? [];
  });


}
