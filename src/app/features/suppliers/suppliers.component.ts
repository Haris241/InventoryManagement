import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-suppliers',
  imports: [TableModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css'
})
export class SuppliersComponent {
  customer = {
    name: "ali",
    country: "pak",
    company: "soft",
    representative: "heehe"

  }
}
