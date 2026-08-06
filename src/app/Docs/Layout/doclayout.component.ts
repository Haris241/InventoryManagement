import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LoadingService } from "../../services/loading.service";
import { BaseApiService } from "../../services/base-api.service";

@Component({
  selector: 'app-doclayout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './doclayout.component.html',
  styleUrl: './doclayout.component.css',
})
export class DoclayoutComponent {
  constructor(private route: Router) { }
  themeService = inject(LoadingService);
  base = inject(BaseApiService);
  isCollapsed = signal(false);
  isMobile = signal(false);
  isCOADropdown = signal(false);
  screenSize = window.matchMedia('(max-width: 768px)');
  showNotifications = signal(false);

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

    if (value === 'COA') {
      return ['/Docs/coa', '/Docs/importCOA'].some(path => currenturl.startsWith(path));
    }
    return false;
  }
  toogleDropdown(value: string) {

    if (value === 'COA') {
      this.isCOADropdown.update(v => !v);
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

}
