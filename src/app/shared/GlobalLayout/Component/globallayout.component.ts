import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../../../services/loading.service';
import { BaseApiService } from '../../../services/base-api.service';
import { DataLayerService } from '../../../services/data-layer.service';
import { NotificationService } from '../../../services/notification.service';
import { SignalIrService } from '../../../services/signal-ir.service';
import { ModuleLayoutConfig, NavGroup } from '../ConfigFiles/nav-config.model';
import { Token } from '../../../Models/Auth.model';
import { NotificationsComponent } from '../../notifications/notifications.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-globallayout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule, NotificationsComponent],
  templateUrl: './globallayout.component.html',
  styleUrl: './globallayout.component.css',
})
export class GloballayoutComponent {
  private routeInfo = inject(ActivatedRoute);
  private router = inject(Router);

  themeService = inject(LoadingService);
  base = inject(BaseApiService);
  dataService = inject(DataLayerService);
  confirmation = inject(ConfirmationService);
  protected readonly notifState = inject(NotificationService);
  protected readonly signalIr = inject(SignalIrService);

  // ---- config comes from route data, so this stays generic ----
  private layoutConfig = toSignal(
    this.routeInfo.data.pipe(map(d => d['layoutConfig'] as ModuleLayoutConfig)),
    { requireSync: true }
  );
  moduleLabel = computed(() => this.layoutConfig().moduleLabel);
  menuGroups = computed(() => this.layoutConfig().menuGroups);

  // Plug permission filtering in here later — for now it just passes config through
  // so nothing changes in behavior until you wire up a PermissionsService.
  visibleMenuGroups = computed(() => this.menuGroups());

  // ---- everything below is unchanged from your original ----
  isCollapsed = signal(false);
  isMobile = signal(false);
  openDropdown = signal<string | null>(null); // replaces isCOADropdown/isVoucherDropdown/isSettingDropdown
  screenSize = window.matchMedia('(max-width: 768px)');
  showNotifications = signal(false);

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
    });
  }

  isActiveGroup(group: NavGroup): boolean {
    const currentUrl = this.router.url;
    return group.children?.some(c => currentUrl.startsWith(c.route)) ?? false;
  }

  isDropdownOpen(key: string): boolean {
    return this.openDropdown() === key;
  }

  toggleDropdown(key: string) {
    this.openDropdown.update(cur => (cur === key ? null : key));
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
          next: () => this.base.logout(),
          error: (err) => this.base.handleError(err, err.error.message)
        });
      },
      reject: () => { }
    });
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }
}
