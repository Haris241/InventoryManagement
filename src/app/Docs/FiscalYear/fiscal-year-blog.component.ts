import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fiscal-year-blog',
  imports: [RouterLink],
  templateUrl: './fiscal-year-blog.component.html',
  styleUrl: './fiscal-year-blog.component.css',
})
export class FiscalYearBlogComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('Fiscal Year Guide | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Understand fiscal years in Harvora ERP — how your starting month sets your accounting calendar, how to manage, close, and switch fiscal years, and what "needs reclosure" means.',
      },
      {
        name: 'keywords',
        content:
          'fiscal year, financial year, accounting period, fiscal year end, close fiscal year, reclosure, multi fiscal year, Harvora ERP',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      { property: 'og:title', content: 'Fiscal Year Guide | Harvora ERP' },
      {
        property: 'og:description',
        content:
          'Learn how fiscal years work in Harvora ERP — from your registration starting month to closing, reclosure, and switching between active years.',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Fiscal Year Guide | Harvora ERP' },
      {
        name: 'twitter:description',
        content: 'How fiscal years, closing, and reclosure work in Harvora ERP.',
      },
    ]);
  }

  ngOnDestroy(): void {
    this.metaService.removeTag("name='description'");
    this.metaService.removeTag("name='keywords'");
    this.metaService.removeTag("name='robots'");
    this.metaService.removeTag("name='author'");
    this.metaService.removeTag("property='og:title'");
    this.metaService.removeTag("property='og:description'");
    this.metaService.removeTag("property='og:type'");
    this.metaService.removeTag("property='og:site_name'");
    this.metaService.removeTag("name='twitter:card'");
    this.metaService.removeTag("name='twitter:title'");
    this.metaService.removeTag("name='twitter:description'");
  }
}
