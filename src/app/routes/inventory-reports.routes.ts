import { Routes } from '@angular/router';

export const inventoryReportsRoutes: Routes = [
    {
        path: 'inventoryReports',
        data: { module: 'Inventory' },
        loadComponent: () => import('../shared/report-layout/report-layout.component').then(m => m.ReportLayoutComponent)
    },
    {
        path: 'inventoryReports/stockLedger',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-ledger/stock-ledger.component').then(m => m.StockLedgerComponent)
    },
    {
        path: 'inventoryReports/currentStock',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/current-stock/current-stock.component').then(m => m.CurrentStockComponent)
    },
    {
        path: 'inventoryReports/warehouseStock',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/warehouse-stock/warehouse-stock.component').then(m => m.WarehouseStockComponent)
    },
    {
        path: 'inventoryReports/stockValuation',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-valuation/stock-valuation.component').then(m => m.StockValuationComponent)
    },
    {
        path: 'inventoryReports/stockAging',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-aging/stock-aging.component').then(m => m.StockAgingComponent)
    },
    {
        path: 'inventoryReports/slowMovingStock',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/slow-moving-stock/slow-moving-stock.component').then(m => m.SlowMovingStockComponent)
    },
    {
        path: 'inventoryReports/reorderStock',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/reorder-stock/reorder-stock.component').then(m => m.ReorderStockComponent)
    },
    {
        path: 'inventoryReports/purchaseAnalysis',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/purchase-analysis/purchase-analysis.component').then(m => m.PurchaseAnalysisComponent)
    },
    {
        path: 'inventoryReports/purchaseOrderOutstanding',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/purchase-order-outstanding/purchase-order-outstanding.component').then(m => m.PurchaseOrderOutstandingComponent)
    },
    {
        path: 'inventoryReports/grnPendingInvoice',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/grn-pending-invoice/grn-pending-invoice.component').then(m => m.GrnPendingInvoiceComponent)
    },
    {
        path: 'inventoryReports/threeWayMatch',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/three-way-match/three-way-match.component').then(m => m.ThreeWayMatchComponent)
    },
    {
        path: 'inventoryReports/supplierPurchaseSummary',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/supplier-purchase-summary/supplier-purchase-summary.component').then(m => m.SupplierPurchaseSummaryComponent)
    },
    {
        path: 'inventoryReports/supplierDeliveryPerformance',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/supplier-delivery-performance/supplier-delivery-performance.component').then(m => m.SupplierDeliveryPerformanceComponent)
    },
    {
        path: 'inventoryReports/purchaseReturnAnalysis',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/purchase-return-analysis/purchase-return-analysis.component').then(m => m.PurchaseReturnAnalysisComponent)
    },
    {
        path: 'inventoryReports/stockMovementSummary',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-movement-summary/stock-movement-summary.component').then(m => m.StockMovementSummaryComponent)
    },
    {
        path: 'inventoryReports/stockTransferReport',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-transfer-report/stock-transfer-report.component').then(m => m.StockTransferReportComponent)
    },
    {
        path: 'inventoryReports/stockAdjustmentReport',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-adjustment-report/stock-adjustment-report.component').then(m => m.StockAdjustmentReportComponent)
    },
    {
        path: 'inventoryReports/outwardMovementReport',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/outward-movement-report/outward-movement-report.component').then(m => m.OutwardMovementReportComponent)
    },
    {
        path: 'inventoryReports/stockReconciliation',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/stock-reconciliation/stock-reconciliation.component').then(m => m.StockReconciliationComponent)
    },
    {
        path: 'inventoryReports/negativeStock',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/negative-stock/negative-stock.component').then(m => m.NegativeStockComponent)
    },
    {
        path: 'inventoryReports/pendingTransactions',
        loadComponent: () => import('../features/InventoryModule/InventoryReport/pending-transactions/pending-transactions.component').then(m => m.PendingTransactionsComponent)
    }
];

