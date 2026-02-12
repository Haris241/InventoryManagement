import { Component } from '@angular/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-fiscalyear',
  imports: [DatePickerModule,FloatLabelModule,InputTextModule],
  templateUrl: './fiscalyear.component.html',
  styleUrl: './fiscalyear.component.css',
})
export class FiscalyearComponent {

}
