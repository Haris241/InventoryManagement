import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {

  themeService = inject(LoadingService);

  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  currentYear = new Date().getFullYear();

  /** Key tech facts displayed in the "Built By" section */
  readonly techStack = [
    { icon: 'hub',            label: '.NET 8 Web API',         desc: 'High-performance RESTful backend with clean architecture.' },
    { icon: 'change_history', label: 'Angular 18',              desc: 'Reactive SPA with standalone components and signals.' },
    { icon: 'storage',        label: 'SQL Server',              desc: 'Relational data with Entity Framework Core migrations.' },
    { icon: 'lock',           label: 'JWT + Refresh Tokens',    desc: 'Stateless auth with secure httpOnly cookie rotation.' },
    { icon: 'bolt',           label: 'SignalR Real-Time',       desc: 'Live dashboard updates without page refresh.' },
    { icon: 'cloud',          label: 'Multi-Tenant SaaS',       desc: 'Isolated workspaces — one platform, many businesses.' },
  ];

  readonly timeline = [
    { year: '2024', title: 'Concept & Architecture', desc: 'Designed the multi-tenant data model, auth flow, and module boundaries.' },
    { year: '2025', title: 'Core Modules Live',       desc: 'Inventory and Accounting shipped — tested end-to-end in real businesses.' },
    { year: '2026', title: 'Expanding the Platform',  desc: 'Role & Rights, Export, and Production modules actively in development.' },
  ];
}
