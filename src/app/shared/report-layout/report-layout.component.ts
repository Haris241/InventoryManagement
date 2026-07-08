import { Component, computed, inject, signal } from '@angular/core';
import { REPORT_CONFIG, ReportSection } from './report.config';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-report-layout',
  imports: [RouterLink],
  templateUrl: './report-layout.component.html',
  styleUrl: './report-layout.component.css',
})
export class ReportLayoutComponent {
  private router = inject(Router);

  columns = signal(4);

  module = computed(() => {

    const url = this.router.url.toLowerCase();

    if (url.includes('/accounts/'))
      return 'Accounts';

    if (url.includes('/inventory/'))
      return 'Inventory';

    return '';
  });

  sections = computed<ReportSection[]>(() => {

    return REPORT_CONFIG.find(x => x.module === this.module())
      ?.sections ?? [];

  });

  gridClass = computed(() => {

    switch (this.columns()) {

      case 2:
        return 'lg:w-1/2';

      case 3:
        return 'lg:w-1/3';

      case 4:
        return 'lg:w-1/4';

      case 5:
        return 'lg:w-1/5';

      default:
        return 'lg:w-1/4';
    }

  });
}
