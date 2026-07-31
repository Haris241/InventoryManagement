import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CashFlowData, CashFlowNodeData, CashFlowSearch, IncomeStatementNodeData, IncomeStatementSearch } from '../../../../Models/Accouting/AccountReports.model';
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
  selector: 'app-cash-flow-statement',
  imports: [RouterLink, TableModule, FormsModule, FloatLabelModule, SelectModule, CommonModule, FormField, DatePickerModule],
  templateUrl: './cash-flow-statement.component.html',
  styleUrl: './cash-flow-statement.component.css',
})
export class CashFlowStatementComponent {
  base = inject(BaseApiService);
  pagination = inject(PaginationService);
  dataService = inject(DataLayerService);
  destroyRef = inject(DestroyRef);

  submit = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  cashFlowData = signal<CashFlowData | null>(null);

  expandedIds = signal<Set<string>>(new Set());

  private flatten(nodes: CashFlowNodeData[], sectionKey: string, level = 0, parentPath = ''): CashFlowNodeData[] {
    const rows: CashFlowNodeData[] = [];
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

  operatingFlat = computed(() => this.flatten(this.cashFlowData()?.operatingActivities.nodes ?? [], 'operatingActivities'));
  investingFlat = computed(() => this.flatten(this.cashFlowData()?.investingActivities.nodes ?? [], 'investingActivities'));
  financingFlat = computed(() => this.flatten(this.cashFlowData()?.financingActivities.nodes ?? [], 'financingActivities'));

  /**
   * Same skip-ahead algorithm as COA tree: a node is visible only if all its
   * ancestors are expanded. When a parent is collapsed, jump past its entire
   * subtree instead of scanning it row by row.
   */
  private computeVisible(flat: CashFlowNodeData[]): CashFlowNodeData[] {
    const len = flat.length;
    if (len === 0) return [];

    const expanded = this.expandedIds();
    const visible: CashFlowNodeData[] = [];

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

  operatingRows = computed(() => this.computeVisible(this.operatingFlat()));
  investingRows = computed(() => this.computeVisible(this.investingFlat()));
  financingRows = computed(() => this.computeVisible(this.financingFlat()));

  toggleExpand(node: CashFlowNodeData): void {
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
    for (const n of [...this.operatingFlat(), ...this.investingFlat(), ...this.financingFlat()]) {
      if (n.hasChildren) ids.add(n.id!);
    }
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  //Model For FormData
  private readonly initialModel: CashFlowSearch = {
    fromDate: null,
    fromDateUI: null,
    toDate: null,
    toDateUI: null,
    includeZeroBalance: false
  };
  //Signal Model For FormData
  cashFlowModel = signal<CashFlowSearch>({ ...this.initialModel });

  // Signal form with validation schema
  cashFlowForm = form(this.cashFlowModel);

  //Method to Update Fields For Non supporting Primeng Fields
  updateField<K extends keyof CashFlowSearch>(field: K, value: CashFlowSearch[K]) {
    this.cashFlowModel.update(prev => ({
      ...prev,
      [field]: value
    }));
  }

  loadCashFlow(event: Event) {
    if (this.submit()) {
      return;
    }
    //Validating the Form
    event.preventDefault();
    this.submit.set(true);
    this.formSubmitted.set(true);
    if (this.cashFlowForm().invalid()) {
      this.cashFlowForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    //Accessing Form Value
    const formvalue = this.cashFlowForm().value() as CashFlowSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    //for update and create
    const url = `AccountsReports/CashFlowList`;
    const request$ = this.dataService.createResponse<CashFlowSearch, CashFlowData>(url, formvalue);

    //Making Api Call
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        this.cashFlowData.set(result);
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
    this.loadCashFlow(event);
  }

  CashFlowReport() {
    if (this.cashFlowForm().invalid()) {
      this.cashFlowForm().markAsTouched();
      this.submit.set(false);
      return;
    }

    const formvalue = this.cashFlowForm().value() as CashFlowSearch;
    formvalue.fromDate = toDateOnlyString(formvalue.fromDateUI) ?? null;
    formvalue.toDate = toDateOnlyString(formvalue.toDateUI) ?? null;

    const newTab = openLoadingTab();
    this.dataService.getReportByData('AccountsReports/CashFlowReport', formvalue)
      .subscribe({
        next: (blob) => {
          showBlobInTab(newTab, blob, `CashFlowStatementReport.pdf`);
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
