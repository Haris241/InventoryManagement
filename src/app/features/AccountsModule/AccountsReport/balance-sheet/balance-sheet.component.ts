import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { BalanceSheetData, BalanceSheetNodeData, BalanceSheetSearch } from '../../../../Models/Accouting/AccountReports.model';
import { form, FormField } from '@angular/forms/signals';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker';
import { openLoadingTab, showBlobInTab, toDateOnlyString } from '../../../../shared/Utility';
import { DataLayerService } from '../../../../services/data-layer.service';
import { PaginationService } from '../../../../services/pagination.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-balance-sheet',
  imports: [TableModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, FormField, DatePickerModule],
  templateUrl: './balance-sheet.component.html',
  styleUrl: './balance-sheet.component.css',
})
export class BalanceSheetComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  balanceSheetData = signal<BalanceSheetData | null>(null);

  expandedIds = signal<Set<string>>(new Set());

  private flatten(nodes: BalanceSheetNodeData[], sectionKey: string, level = 0, parentPath = ''): BalanceSheetNodeData[] {
    const rows: BalanceSheetNodeData[] = [];
    for (const node of nodes) {
      const id = `${sectionKey}${parentPath}/${node.accountId}-${node.accountCode}`;
      const hasChildren = !node.isLeaf && !!node.children?.length;
      rows.push({ ...node, id, level, hasChildren });
      if (hasChildren) {
        rows.push(...this.flatten(node.children, sectionKey, level + 1, id));
      }
    }
    return rows;
  }

  assetsFlat = computed(() => this.flatten(this.balanceSheetData()?.assets.nodes ?? [], 'assets'));
  liabilitiesFlat = computed(() => this.flatten(this.balanceSheetData()?.liabilities.nodes ?? [], 'liabilities'));
  equityFlat = computed(() => this.flatten(this.balanceSheetData()?.equity.nodes ?? [], 'equity'));

  /**
   * Same skip-ahead algorithm as COA tree: a node is visible only if all its
   * ancestors are expanded. When a parent is collapsed, jump past its entire
   * subtree instead of scanning it row by row.
   */
  private computeVisible(flat: BalanceSheetNodeData[]): BalanceSheetNodeData[] {
    const len = flat.length;
    if (len === 0) return [];

    const expanded = this.expandedIds();
    const visible: BalanceSheetNodeData[] = [];

    let i = 0;
    while (i < len) {
      const node = flat[i];
      visible.push(node);

      if (node.hasChildren && !expanded.has(node.id!)) {
        const currentLevel = node.level!;
        i++;
        while (i < len && flat[i].level! > currentLevel) {
          i++;
        }
      } else {
        i++;
      }
    }
    return visible;
  }

  assetsRows = computed(() => this.computeVisible(this.assetsFlat()));
  liabilitiesRows = computed(() => this.computeVisible(this.liabilitiesFlat()));
  equityRows = computed(() => this.computeVisible(this.equityFlat()));

  toggleExpand(node: BalanceSheetNodeData): void {
    if (!node.hasChildren) return;
    this.expandedIds.update(current => {
      const next = new Set(current);
      next.has(node.id!) ? next.delete(node.id!) : next.add(node.id!);
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  expandAll(): void {
    const ids = new Set<string>();
    for (const n of [...this.assetsFlat(), ...this.liabilitiesFlat(), ...this.equityFlat()]) {
      if (n.hasChildren) ids.add(n.id!);
    }
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  //Model For FormData
  private readonly initialModel: BalanceSheetSearch = {
    asOfDate: null,
    asOfDateUI: null,
    includeZeroBalance: false,
    showLedgerAccounts: false
  };
  //Signal Model For FormData
  balanceSheetModel = signal<BalanceSheetSearch>({ ...this.initialModel });

  // Signal form with validation schema
  balanceSheetForm = form(this.balanceSheetModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof BalanceSheetSearch>(field: K, value: BalanceSheetSearch[K]) {
    this.balanceSheetModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadBalanceSheet(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.balanceSheetForm().invalid()) {
      this.balanceSheetForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    const formvalue = this.balanceSheetForm().value() as BalanceSheetSearch;
    formvalue.asOfDate = toDateOnlyString(formvalue.asOfDateUI) ?? null;

    //for update and create
    const url = `AccountsReports/BalanceSheetList`;
    const request$ = this.dataService.createResponse<BalanceSheetSearch, BalanceSheetData>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.balanceSheetData.set(result);
        this.submit.set(false);
        this.formSubmitted.set(false);
      },
      error: (err) => {
        this.submit.set(false);
        this.base.handleError(err, err.error?.message, false);

      }
    });
  }

  //On Search
  OnSearch(event: Event) {
    this.loadBalanceSheet(event);
  }
  BalanceSheetReport() {
    if (this.balanceSheetForm().invalid()) {
      this.balanceSheetForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.balanceSheetForm().value() as BalanceSheetSearch;
    formvalue.asOfDate = toDateOnlyString(formvalue.asOfDateUI) ?? null;

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/BalanceSheetReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `BalanceSheetReport.pdf`);
          this.submit.set(false);
          this.formSubmitted.set(false);

        },
        error: (err) => {
          this.submit.set(false);
          if (newTab) newTab.close();
          this.base.handleError(err, err.error?.message);
        }
      });

  }

}
