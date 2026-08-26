import { CommonModule } from '@angular/common';
import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Token } from '../../../Models/Auth.model';
import { LoadingService } from '../../../services/loading.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { BaseApiService } from '../../../services/base-api.service';
import { NotificationService } from '../../../services/notification.service';
import { SignalIrService } from '../../../services/signal-ir.service';
import { NotificationsComponent } from '../../../shared/notifications/notifications.component';



@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule, NotificationsComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LayoutComponent {
  constructor(private route: Router) { }
  themeService = inject(LoadingService);
  base = inject(BaseApiService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);
  showNotifications = signal(false);
  isCollapsed = signal(false);
  isMobile = signal(false);
  isProductDropdown = signal(false);
  isSupplierDropdown = signal(false);
  isWarehouseDropdown = signal(false);
  isProductSetupDropdown = signal(false);
  screenSize = window.matchMedia('(max-width: 768px)');
  notifState = inject(NotificationService);
  signalIr = inject(SignalIrService);

  ngOnInit() {
    this.signalIr.startConnection();
    this.notifState.getUserNotifications();
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
      return ['/Inventory/addproduct', '/Inventory/products', '/Inventory/addproductcategory', '/Inventory/productcategorieslist', '/Inventory/productcategoriestree'].some(path => currenturl.startsWith(path));
    }
    if (value === 'Supplier') {
      return ['/Inventory/addsupplier', '/Inventory/suppliers'].some(path => currenturl.startsWith(path));
    }
    if (value === 'Warehouse') {
      return ['/Inventory/addwarehouse', '/Inventory/warehouselist'].some(path => currenturl.startsWith(path));
    }
    if (value === 'ProductSetup') {
      return ['/Inventory/addbrand', '/Inventory/brandslist'].some(path => currenturl.startsWith(path));
    }
    return false;
  }
  toogleDropdown(value: string) {
    if (value === 'Product') {
      this.isProductDropdown.update(v => !v);
      this.isSupplierDropdown.set(false);
      this.isWarehouseDropdown.set(false);
      this.isProductSetupDropdown.set(false);
    }
    if (value === 'Supplier') {
      this.isSupplierDropdown.update(v => !v);
      this.isProductDropdown.set(false);
      this.isWarehouseDropdown.set(false);
      this.isProductSetupDropdown.set(false);
    }
    if (value === 'Warehouse') {
      this.isWarehouseDropdown.update(v => !v);
      this.isProductDropdown.set(false);
      this.isSupplierDropdown.set(false);
      this.isProductSetupDropdown.set(false);
    }
    if (value === 'ProductSetup') {
      this.isProductSetupDropdown.update(v => !v);
      this.isProductDropdown.set(false);
      this.isSupplierDropdown.set(false);
      this.isWarehouseDropdown.set(false);
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
        this.dataService.createResponse<void, Token>('Auth/logout').subscribe({
          next: () => {
            this.base.logout();
          },
          error: (err) => {
            this.base.handleError(err, err.error.message);
          }
        });
      },
      reject: () => {
        // Optional: handle rejection
      }

    });
  }
  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }
}
