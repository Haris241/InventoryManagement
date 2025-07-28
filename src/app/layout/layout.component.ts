import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  constructor(private route: Router) { }

  isCollapsed = false;
  isMobile = false;
  isProductDropdown = false;
  isSupplierDropdown = false;
  screenSize = window.matchMedia('(max-width: 768px)');
  ngOnInit() {
    if (this.screenSize.matches) {
      this.isMobile = true;
      this.isCollapsed = true;
    }
    this.screenSize.addEventListener('change', (e) => {
      this.isMobile = e.matches;
      this.isCollapsed = e.matches;
    })

  }

  isActiveGroup(value: string): boolean {
    const currenturl = this.route.url;
    if (value === 'Product') {
      return ['/addproduct', '/products'].some(path => currenturl.startsWith(path));
    }
    if (value === 'Supplier') {
      return ['/addsupplier', '/suppliers'].some(path => currenturl.startsWith(path));
    }
    return false;
  }
  toogleDropdown(value: string) {
    if (value === 'Product') {
      this.isProductDropdown = !this.isProductDropdown
      this.isSupplierDropdown = false;
    }
    if (value === 'Supplier') {
      this.isSupplierDropdown = !this.isSupplierDropdown
      this.isProductDropdown = false;
    }
  }
  toogleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    if (this.screenSize.matches) {
      this.isMobile = !this.isMobile;
    }
  }
  onSelectMobile() {
    if (this.screenSize.matches) {
      this.isCollapsed = true;
      this.isMobile = true;
    }
  }
}
