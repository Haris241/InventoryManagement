import { Component, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule, AsyncPipe, ConfirmDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  title = 'InventoryManagement';
  isloading!: Observable<boolean>;

  private loader = inject(LoadingService);
  private cdRef = inject(ChangeDetectorRef);

  ngOnInit() {
    this.isloading = this.loader.loading$;
  }

  ngAfterViewInit() {
    // Trigger change detection after the first emission
    this.isloading.subscribe(() => {
      this.cdRef.detectChanges();
    });
  }



}
