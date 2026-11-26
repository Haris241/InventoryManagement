

// ============================================================================
// Control Enums

import { CursorPaginationResult } from "../Pagination.model";

// ============================================================================
export enum StockReconciliationMode {
    PhysicalCount = 0,
    LedgerVsSnapshot = 1
}

export enum PendingTransactionType {
    All = 0,
    GateEntry = 1,
    StockTransfer = 2,
    StockAdjustment = 3,
    GRN = 4,
    OutwardGatePass = 5,
    PurchaseOrder = 6
}

export enum PendingTransactionStage {
    All = 0,
    Draft = 1,
    InTransit = 2,
    AwaitingApproval = 3,
    PendingDelivery = 4,
    AwaitingGrn = 5,
    PendingGateExit = 6
}

// ============================================================================
// 1. Stock Reconciliation
// ============================================================================
export interface StockReconciliationSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    warehouseId: number | null;
    productId: string | null;
    productVariantId: string | null;
    varianceOnly: boolean | null;
    mode: StockReconciliationMode | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockReconciliationData {
    fromDate: Date;
    toDate: Date;
    mode: string;
    filterWarehouse: string;
    totalItemsCounted: number;
    matchedItemsCount: number;
    discrepancyItemsCount: number;
    accuracyRate: number;
    totalBookValue: number;
    totalPhysicalValue: number;
    netVarianceValue: number;
    totalSurplusValue: number;
    totalShortageValue: number;
    items: CursorPaginationResult<StockReconciliationItemData>;
}

export interface StockReconciliationItemData {
    id: string;
    createdAt: Date;
    reconciliationDate: Date;
    documentNo: string;
    warehouseName: string;
    sku: string;
    productName: string;
    variantName: string;
    uom: string;
    bookQuantity: number;
    physicalQuantity: number;
    varianceQuantity: number;
    unitCost: number;
    bookValue: number;
    physicalValue: number;
    varianceValue: number;
    reconciliationStatus: string;
    remarks: string | null;
}

// ============================================================================
// 2. Negative Stock
// ============================================================================
export interface NegativeStockSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    warehouseId: number | null;
    productCategoryId: number | null;
    productId: string | null;
    productVariantId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface NegativeStockData {
    asOfDate: Date;
    filterWarehouse: string;
    filterCategory: string;
    totalNegativeItems: number;
    totalNegativeQuantity: number;
    totalDeficitValue: number;
    affectedWarehousesCount: number;
    items: CursorPaginationResult<NegativeStockItemData>;
}

export interface NegativeStockItemData {
    id: string;
    createdAt: Date;
    warehouseName: string;
    locationName: string | null;
    sku: string;
    productName: string;
    variantName: string;
    categoryName: string;
    uom: string;
    currentQuantity: number;
    averageCost: number;
    deficitValue: number;
    isCostUnknown: boolean;
    lastMovementDate: Date;
    lastMovementReference: string | null;
    lastMovementType: string | null;
}

// ============================================================================
// 3. Pending Transactions
// ============================================================================
export interface PendingTransactionsSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    warehouseId: number | null;
    transactionType: PendingTransactionType | null;
    stage: PendingTransactionStage | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface PendingTransactionsData {
    fromDate: Date | null;
    toDate: Date | null;
    filterTransactionType: string;
    filterWarehouse: string;
    totalPendingTransactions: number;
    totalPendingValue: number;
    draftCount: number;
    inTransitCount: number;
    awaitingApprovalCount: number;
    pendingDeliveryCount: number;
    gateEntryCount: number;
    transactions: CursorPaginationResult<PendingTransactionItemData>;
}

export interface PendingTransactionItemData {
    id: string;
    createdAt: Date;
    transactionDate: Date;
    transactionType: string;
    documentNo: string;
    sourceWarehouse: string;
    destinationWarehouse: string;
    stage: string;
    itemCount: number;
    pendingQuantity: number;
    pendingValue: number;
    daysPending: number;
    createdBy: string;
    remarks: string | null;
}