import { Component, computed, inject, signal } from '@angular/core';
import { REPORT_CONFIG, ReportSection } from './report.config';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-report-layout',
  imports: [RouterLink],
  templateUrl: './report-layout.component.html',
  styleUrl: './report-layout.component.css',
})
export class ReportLayoutComponent {
  private route = inject(ActivatedRoute);

  module = toSignal(

    this.route.data.pipe(

      map(data => data['module'])

    ),

    {
      initialValue: ''
    }

  );

  columns = signal(4);


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
