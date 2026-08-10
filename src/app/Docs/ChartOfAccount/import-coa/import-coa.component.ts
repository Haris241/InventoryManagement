import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-import-coa',
  imports: [RouterLink],
  templateUrl: './import-coa.component.html',
  styleUrl: './import-coa.component.css',
})
export class ImportCoaComponent {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit(): void {
    this.titleService.setTitle('Bulk Import Chart of Accounts | Harvora ERP');

    this.metaService.addTags([
      {
        name: 'description',
        content:
          'Step-by-step guide to bulk importing your Chart of Accounts into Harvora ERP using the Excel template — columns, parent/child rules, and validation.',
      },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: 'Bulk Import Chart of Accounts | Harvora ERP' },
      {
        property: 'og:description',
        content: 'Learn how to fill and upload the Chart of Accounts bulk import template in Harvora ERP.',
      },
      { property: 'og:type', content: 'website' },
    ]);
  }

  ngOnDestroy(): void {
    this.metaService.removeTag("name='description'");
    this.metaService.removeTag("name='robots'");
    this.metaService.removeTag("property='og:title'");
    this.metaService.removeTag("property='og:description'");
    this.metaService.removeTag("property='og:type'");
  }
}
