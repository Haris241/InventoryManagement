import { CommonModule } from '@angular/common';
import { Component, inject, signal,CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Token } from '../../../Models/Auth.model';
import { LoadingService } from '../../../services/loading.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { BaseApiService } from '../../../services/base-api.service';



@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutComponent {
  constructor(private route: Router) { }
  themeService = inject(LoadingService);
  base = inject(BaseApiService);
  dataService=inject(DataLayerService);
  confirmation = inject(ConfirmationService);
  isCollapsed = signal(false);
  isMobile = signal(false);
  isProductDropdown = signal(false);
  isSupplierDropdown = signal(false);
  screenSize = window.matchMedia('(max-width: 768px)');
  ngOnInit() {
    if (this.screenSize.matches) {
      this.isMobile.set(true);
      this.isCollapsed.set(true);
    }
    this.screenSize.addEventListener('change', (e) => {
      this.isMobile.set(e.matches);
      this.isCollapsed.set(e.matches);
    })

  }

  isActiveGroup(value: string): boolean {
    const currenturl = this.route.url;
    if (value === 'Product') {
      return ['/Inventory/addproduct', '/Inventory/products'].some(path => currenturl.startsWith(path));
    }
    if (value === 'Supplier') {
      return ['/Inventory/addsupplier', '/Inventory/suppliers'].some(path => currenturl.startsWith(path));
    }
    return false;
  }
  toogleDropdown(value: string) {
    if (value === 'Product') {
      this.isProductDropdown.update(v => !v);
      this.isSupplierDropdown.set(false);
    }
    if (value === 'Supplier') {
      this.isSupplierDropdown.update(v => !v);
      this.isProductDropdown.set(false);
    }
  }
  toogleSidebar() {
    this.isCollapsed.update(v => !v);
    if (this.screenSize.matches) {
      this.isMobile.update(v => !v);
    }
  }
  onSelectMobile() {
    if (this.screenSize.matches) {
      this.isCollapsed.set(true);
      this.isMobile.set(true);
    }
  }
  ChangeTheme() {
    this.themeService.toggleTheme();
  }
  ConifmationLogout() {
    this.confirmation.confirm({
      message: 'Are you sure you want to Log Out?',
      header: 'Logout Confirmation',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => {
        this.dataService.createResponse<void,Token>('Auth/logout').subscribe({
          next:()=>{
             this.base.logout();
          },
          error: (err)=>{
            this.base.handleError(err,err.error.message);
          }
        });
      },
      reject: () => {
        // Optional: handle rejection
      }

    });
  }
}
