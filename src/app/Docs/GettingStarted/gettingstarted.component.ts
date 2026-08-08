import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gettingstarted',
  imports: [RouterLink],
  templateUrl: './gettingstarted.component.html',
  styleUrl: './gettingstarted.component.css',
})
export class GettingstartedComponent implements OnInit, OnDestroy {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    // SEO: Page title
    this.titleService.setTitle('Getting Started with Harvora ERP | Where Business Flows');

    // SEO: Meta tags
    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Get started with Harvora ERP — a fast, modern, multi-tenant cloud ERP for textile, garments, and general businesses. Manage inventory, accounting, and more from one platform.',
      },
      {
        name: 'keywords',
        content:
          'Harvora ERP, ERP software, inventory management, accounting software, SaaS ERP, cloud ERP, textile ERP, garments ERP, business management, multi-tenant ERP, getting started',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      // Open Graph
      { property: 'og:title', content: 'Getting Started with Harvora ERP | Where Business Flows' },
      {
        property: 'og:description',
        content:
          'Harvora ERP is a modern, multi-tenant SaaS ERP platform built for all businesses — from small shops to large enterprises. Start your free journey today.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Getting Started with Harvora ERP | Where Business Flows' },
      {
        name: 'twitter:description',
        content:
          'Discover how Harvora ERP helps textile, garments, and general businesses manage inventory and accounting with speed and simplicity.',
      },
    ]);
  }

  ngOnDestroy(): void {
    // Clean up meta tags when leaving the page
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
