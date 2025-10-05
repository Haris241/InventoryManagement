import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ToastModule,AsyncPipe, ConfirmDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  title = 'InventoryManagement';
  isloading!: Observable<boolean>;

  constructor() {
    const loader = inject(LoadingService);   
    this.isloading = loader.loading$;
  }

}
