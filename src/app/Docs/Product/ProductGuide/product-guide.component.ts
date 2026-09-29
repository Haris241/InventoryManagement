import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-guide',
  imports: [RouterLink],
  templateUrl: './product-guide.component.html',
  styleUrl: './product-guide.component.css',
})
export class ProductGuideComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('Products & Variants Guide | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Learn how product master data works in Harvora ERP — variants, SKUs, attributes, opening stock, and the rules behind creating and editing products in an inventory system.',
      },
      {
        name: 'keywords',
        content:
          'product master data, SKU, product variants, opening stock, inventory setup, product attributes, cost price, selling price, Harvora ERP, inventory management software',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      { property: 'og:title', content: 'Products & Variants Guide | Harvora ERP' },
      {
        property: 'og:description',
        content:
          'How products, variants, SKUs, and opening stock work together in Harvora ERP — and the rules that keep your inventory data clean.',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Products & Variants Guide | Harvora ERP' },
      {
        name: 'twitter:description',
        content: 'A complete guide to setting up products and variants in Harvora ERP.',
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
