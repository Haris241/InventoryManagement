import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-voucher-blog',
  imports: [RouterLink],
  templateUrl: './voucher-blog.component.html',
  styleUrl: './voucher-blog.component.css',
})
export class VoucherBlogComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('Voucher Manager Guide | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Learn how vouchers work in Harvora ERP — Journal, Opening, Cash Payment, Cash Receipt, Bank Payment, Bank Receipt, Contra, Purchase, and Sales vouchers, and the double-entry rules behind each.',
      },
      {
        name: 'keywords',
        content:
          'voucher entry, accounting vouchers, journal voucher, cash payment voucher, cash receipt voucher, bank payment voucher, bank receipt voucher, contra voucher, double-entry accounting, multi-currency accounting, Harvora ERP',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      { property: 'og:title', content: 'Voucher Manager Guide | Harvora ERP' },
      {
        property: 'og:description',
        content:
          'A complete guide to every voucher type in Harvora ERP — what each one is for, how its lines behave, and how double-entry balancing works with multi-currency transactions.',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Voucher Manager Guide | Harvora ERP' },
      {
        name: 'twitter:description',
        content: 'Every voucher type in Harvora ERP explained — Journal, Cash, Bank, Contra, Purchase, and Sales.',
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

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
