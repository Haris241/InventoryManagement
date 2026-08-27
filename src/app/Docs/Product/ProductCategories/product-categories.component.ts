import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-categories',
  imports: [RouterLink],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css',
})
export class ProductCategoriesComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('Product Categories Guide | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Understand product categories in Harvora ERP — hierarchical structure, unique codes, leaf vs group categories, and how attaching Chart of Accounts drives category-wise GRN and COGS posting.',
      },
      {
        name: 'keywords',
        content:
          'product categories, inventory categories, category hierarchy, GRN account, COGS account, sales account, category-wise costing, Harvora ERP, inventory management',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      { property: 'og:title', content: 'Product Categories Guide | Harvora ERP' },
      {
        property: 'og:description',
        content:
          'How product categories organize your catalogue in Harvora ERP, and how attaching Inventory, Sales, and COGS accounts lets GRNs and invoices post category-wise.',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Product Categories Guide | Harvora ERP' },
      {
        name: 'twitter:description',
        content: 'How hierarchical product categories and category-linked accounts work in Harvora ERP.',
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
