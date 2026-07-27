import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { BalanceSheetNodeData, BalanceSheetSearch, IncomeStatementData, IncomeStatementNodeData, IncomeStatementSearch } from '../../../../Models/Accouting/AccountReports.model';
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
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-income-statement',
  imports: [RouterLink, TableModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, FormField, DatePickerModule],
  templateUrl: './income-statement.component.html',
  styleUrl: './income-statement.component.css',
})
export class IncomeStatementComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  incomeStatementData = signal<IncomeStatementData | null>(null);

  expandedIds = signal<Set<string>>(new Set());

  private flatten(nodes: IncomeStatementNodeData[], sectionKey: string, level = 0, parentPath = ''): IncomeStatementNodeData[] {
    const rows: IncomeStatementNodeData[] = [];
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

  expensesFlat = computed(() => this.flatten(this.incomeStatementData()?.expense.nodes ?? [], 'expense'));
  revenueFlat = computed(() => this.flatten(this.incomeStatementData()?.revenue.nodes ?? [], 'revenue'));

  /**
   * Same skip-ahead algorithm as COA tree: a node is visible only if all its
   * ancestors are expanded. When a parent is collapsed, jump past its entire
   * subtree instead of scanning it row by row.
   */
  private computeVisible(flat: IncomeStatementNodeData[]): IncomeStatementNodeData[] {
    const len = flat.length;
    if (len === 0) return [];

    const expanded = this.expandedIds();
    const visible: IncomeStatementNodeData[] = [];

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

  expensesRows = computed(() => this.computeVisible(this.expensesFlat()));
  revenueRows = computed(() => this.computeVisible(this.revenueFlat()));

  toggleExpand(node: IncomeStatementNodeData): void {
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
    for (const n of [...this.expensesFlat(), ...this.revenueFlat()]) {
      if (n.hasChildren) ids.add(n.id!);
    }
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  //Model For FormData
  private readonly initialModel: IncomeStatementSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    includeZeroBalance: false,
    showLedgerAccounts: false
  };
  //Signal Model For FormData
  incomeStatementModel = signal<IncomeStatementSearch>({ ...this.initialModel });

  // Signal form with validation schema
  incomeStatementForm = form(this.incomeStatementModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof IncomeStatementSearch>(field: K, value: IncomeStatementSearch[K]) {
    this.incomeStatementModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadIncomeStatement(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.incomeStatementForm().invalid()) {
      this.incomeStatementForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    const formvalue = this.incomeStatementForm().value() as IncomeStatementSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    //for update and create
    const url = `AccountsReports/IncomeStatementList`;
    const request$ = this.dataService.createResponse<IncomeStatementSearch, IncomeStatementData>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.incomeStatementData.set(result);
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
    this.loadIncomeStatement(event);
  }
  IncomeStatementReport() {
    if (this.incomeStatementForm().invalid()) {
      this.incomeStatementForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.incomeStatementForm().value() as IncomeStatementSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/IncomeStatemenReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `IncomeStatementReport.pdf`);
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
