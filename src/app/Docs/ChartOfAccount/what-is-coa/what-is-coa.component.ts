import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-what-is-coa',
  imports: [RouterLink],
  templateUrl: './what-is-coa.component.html',
  styleUrl: './what-is-coa.component.css',
})
export class WhatIsCoaComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('What Is a Chart of Accounts? | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'A Chart of Accounts (COA) is the master list of every account your business uses to record transactions. Learn how Group and Ledger accounts, account categories, and normal balances work in Harvora ERP.',
      },
      {
        name: 'keywords',
        content:
          'Chart of Accounts, COA, ledger accounts, group accounts, account categories, debit credit normal balance, accounting structure, Harvora ERP, double-entry bookkeeping',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Harvora ERP' },
      { property: 'og:title', content: 'What Is a Chart of Accounts? | Harvora ERP' },
      {
        property: 'og:description',
        content:
          'Understand how the Chart of Accounts organizes every financial account in your business — categories, hierarchy, and normal balances explained simply.',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: 'Harvora ERP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'What Is a Chart of Accounts? | Harvora ERP' },
      {
        name: 'twitter:description',
        content: 'A plain-language guide to the Chart of Accounts — the backbone of every accounting system.',
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
