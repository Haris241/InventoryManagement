import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../../services/data-layer.service';
import { COATreeView } from '../../../../Models/Accouting/ChartOfAccount.model';
import { BaseApiService } from '../../../../services/base-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coa-tree',
  imports: [CommonModule],
  templateUrl: './coa-tree.component.html',
  styleUrl: './coa-tree.component.css',
})
export class CoaTreeComponent {

  private dataService = inject(DataLayerService);
  private base = inject(BaseApiService);
  private destroyRef = inject(DestroyRef);

  coaTreeData = signal<COATreeView[]>([]);
  expandedIds = signal<Set<number>>(new Set());

  /** Visible rows: a node is visible if all its ancestors are expanded */
  visibleNodes = computed(() => {
    const all = this.coaTreeData();
    const expanded = this.expandedIds();
    const visible: COATreeView[] = [];
    const ancestorStack: number[] = []; // stack of ancestor IDs at each level

    for (const node of all) {
      // Keep the ancestor stack in sync with the current level
      ancestorStack.length = node.level;

      // A root node (level 0) is always visible.
      // A deeper node is visible only if its parent is in the expanded set.
      if (node.level === 0) {
        visible.push(node);
      } else {
        const parentId = ancestorStack[node.level - 1];
        if (parentId !== undefined && expanded.has(parentId)) {
          visible.push(node);
        } else {
          continue; // skip this node and its descendants
        }
      }

      // Push this node's ID so its children can reference it
      ancestorStack[node.level] = node.id;
    }

    return visible;
  });

  ngOnInit(): void {
    this.loadCOATree();
  }

  loadCOATree(): void {
    this.dataService.getAll<COATreeView[]>('COA').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.coaTreeData.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  toggleExpand(node: COATreeView): void {
    if (!node.hasChildren) return;

    const current = new Set(this.expandedIds());
    if (current.has(node.id)) {
      current.delete(node.id);
    } else {
      current.add(node.id);
    }
    this.expandedIds.set(current);
  }

  isExpanded(nodeId: number): boolean {
    return this.expandedIds().has(nodeId);
  }

  expandAll(): void {
    const ids = new Set(
      this.coaTreeData().filter(n => n.hasChildren).map(n => n.id)
    );
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }
}
