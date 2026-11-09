export interface ReportItem {
    title: string;
    route: string;
    icon?: string;
}

export interface ReportSection {
    heading: string;
    reports: ReportItem[];
}

export interface ModuleReports {
    module: string;
    sections: ReportSection[];
}

export const REPORT_CONFIG: ModuleReports[] = [
    {
        module: 'Accounts',
        sections: [
            {
                heading: 'Ledger & Transaction Reports',
                reports: [
                    { title: 'General Ledger', route: 'generalLedger' },
                    { title: 'Full Account Statement', route: 'fullAccountStatement' },
                    { title: 'Cash Bank Book', route: 'cashbankbook' },
                    { title: 'Day Book', route: 'daybook' }
                ]
            },
            {
                heading: 'Financial Reports',
                reports: [
                    { title: 'Trial Balance', route: 'trialBalance' },
                    { title: 'Income Statement (P&L)', route: 'incomestatement' },
                    { title: 'Balance Sheet', route: 'balancesheet' },
                    { title: 'Cash Flow Statement', route: 'cashflowstatement' }
                ]
            }
        ]
    },
    {
        module: 'Inventory',
        sections: [
            {
                heading: 'Stock Reports',
                reports: [
                    { title: 'Stock Ledger', route: 'stockLedger' },
                    { title: 'Current Stock', route: 'currentStock' },
                    { title: 'Warehouse-wise Stock', route: 'warehouseStock' },
                    { title: 'Stock Valuation', route: 'stockValuation' },
                    { title: 'Stock Aging', route: 'stockAging' },
                    { title: 'Slow & Non-Moving Stock', route: 'slowMovingStock' },
                    { title: 'Reorder / Low Stock', route: 'reorderStock' }
                ]
            },
            {
                heading: 'Procurement & Purchasing Reports',
                reports: [
                    { title: 'Purchase Analysis', route: 'purchaseAnalysis' },
                    { title: 'Purchase Order Outstanding', route: 'purchaseOrderOutstanding' },
                    { title: 'GRN Pending Invoice', route: 'grnPendingInvoice' },
                    { title: 'Three-Way Match', route: 'threeWayMatch' },
                    { title: 'Supplier Purchase Summary', route: 'supplierPurchaseSummary' },
                    { title: 'Supplier Delivery Performance', route: 'supplierDeliveryPerformance' },
                    { title: 'Purchase Return Analysis', route: 'purchaseReturnAnalysis' }
                ]
            },
            {
                heading: 'Inventory Movement Reports',
                reports: [
                    { title: 'Stock Movement Summary', route: 'stockMovementSummary' },
                    { title: 'Stock Transfer Report', route: 'stockTransferReport' },
                    { title: 'Stock Adjustment Report', route: 'stockAdjustmentReport' },
                    { title: 'Outward Movement Report', route: 'outwardMovementReport' }
                ]
            },
            {
                heading: 'Inventory Control Reports',
                reports: [
                    { title: 'Stock Reconciliation', route: 'stockReconciliation' },
                    { title: 'Negative Stock Report', route: 'negativeStock' },
                    { title: 'Pending Transactions', route: 'pendingTransactions' }
                ]
            }
        ]
    }
];