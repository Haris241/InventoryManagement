import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DataLayerService } from '../../../../services/data-layer.service';
import { BaseApiService } from '../../../../services/base-api.service';
import { ProductCategoriesTreeView } from '../../../../Models/Inventory/ProductCategories.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-categories-tree',
  imports: [],
  templateUrl: './product-categories-tree.component.html',
  styleUrl: './product-categories-tree.component.css',
})
export class ProductCategoriesTreeComponent {
  private dataService = inject(DataLayerService);
  private base = inject(BaseApiService);
  private destroyRef = inject(DestroyRef);

  productCategoryTreeData = signal<ProductCategoriesTreeView[]>([]);
  expandedIds = signal<Set<number>>(new Set());

  /**
   * Visible rows: a node is visible if ALL its ancestors are expanded.
   *
   * Optimization: when a parent is collapsed we jump past its entire subtree
   * instead of iterating and skipping one-by-one.  With 2–3k nodes this
   * turns an O(n) scan into something much faster for the common case where
   * most subtrees are collapsed.
   */
  visibleNodes = computed(() => {
    const all = this.productCategoryTreeData();
    const len = all.length;
    if (len === 0) return [];

    const expanded = this.expandedIds();
    const visible: ProductCategoriesTreeView[] = [];

    let i = 0;
    while (i < len) {
      const node = all[i];

      // Root nodes (level 0) are always visible
      // Deeper nodes only reach this point if their parent was expanded (see skip below)
      visible.push(node);

      // If node has children but is NOT expanded, skip the entire subtree
      if (node.hasChildren && !expanded.has(node.id)) {
        const currentLevel = node.level;
        i++;
        // Skip all nodes whose level is deeper than the current node
        while (i < len && all[i].level > currentLevel) {
          i++;
        }
      } else {
        i++;
      }
    }

    return visible;
  });

  /** Pre-built lookup set for O(1) template checks — avoids calling expandedIds() per row */
  private expandedSnapshot = computed(() => this.expandedIds());

  ngOnInit(): void {
    this.loadCOATree();
  }

  loadCOATree(): void {
    this.dataService.getAll<ProductCategoriesTreeView[]>('COA').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.productCategoryTreeData.set(res);
      },
      error: (err) => {
        this.base.handleError(err, err.error.message);
      }
    });
  }

  toggleExpand(node: ProductCategoriesTreeView): void {
    if (!node.hasChildren) return;

    // Use signal.update to avoid unnecessary intermediate allocations
    this.expandedIds.update(current => {
      const next = new Set(current);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }

  isExpanded(nodeId: number): boolean {
    return this.expandedSnapshot().has(nodeId);
  }

  expandAll(): void {
    const ids = new Set<number>();
    for (const n of this.productCategoryTreeData()) {
      if (n.hasChildren) ids.add(n.id);
    }
    this.expandedIds.set(ids);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }
}
