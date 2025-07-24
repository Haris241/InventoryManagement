import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  isCollapsed = false;
  isMobile = false;
  screenSize= window.matchMedia('(max-width: 768px)');
  ngOnInit() {
    if (this.screenSize.matches) {
      this.isMobile = true;
      this.isCollapsed=true;
    }
    this.screenSize.addEventListener('change',(e)=>{
      this.isMobile=e.matches;
      this.isCollapsed=e.matches;
    })

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
