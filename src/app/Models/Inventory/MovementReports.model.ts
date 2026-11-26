
// ============================================================================
// Movement Enums

import { CursorPaginationResult } from "../Pagination.model";

// ============================================================================
export enum StockTransferMode {
    Direct = 0,
    TwoStep = 1
}

export enum StockTransferStatus {
    Draft = 0,
    Approved = 1,
    PartiallyReceived = 2,
    Received = 3,
    Cancelled = 4
}

export enum StockAdjustmentReason {
    PhysicalCount = 0,
    Damaged = 1,
    Expired = 2,
    LostOrTheft = 3,
    Found = 4,
    OpeningBalance = 5,
    Other = 6
}

export enum StockAdjustmentStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}

export enum StockAdjustmentType {
    All = 0,
    Increase = 1,
    Decrease = 2
}

export enum StockSourceType {
    GRN = 1,
    Issuance = 2,
    SalesOrder = 3,
    PurchaseReturn = 4,
    SalesReturn = 5,
    StockTransfer = 6,
    StockAdjustment = 7,
    ProductionConsumption = 8,
    ProductionOutput = 9,
    OpeningStock = 10,
    PurchaseOrder = 11,
    PurchaseInvoice = 12,
    OutwardGatePass = 13
}

// ============================================================================
// 1. Stock Movement Summary
// ============================================================================
export interface StockMovementSummarySearch {
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

export interface StockMovementSummaryData {
    fromDate: Date;
    toDate: Date;
    filterWarehouse: string;
    filterCategory: string;
    totalItems: number;
    totalOpeningQuantity: number;
    totalOpeningValue: number;
    totalInQuantity: number;
    totalInValue: number;
    totalOutQuantity: number;
    totalOutValue: number;
    totalNetQuantity: number;
    totalNetValue: number;
    totalClosingQuantity: number;
    totalClosingValue: number;
    items: CursorPaginationResult<StockMovementSummaryItemData>;
}

export interface StockMovementSummaryItemData {
    id: string;
    createdAt: Date;
    productId: string;
    productVariantId: string;
    warehouseId: number;
    sku: string;
    productName: string;
    variantName: string;
    categoryName: string;
    uom: string;
    warehouseName: string;
    openingQuantity: number;
    openingValue: number;
    inQuantity: number;
    inValue: number;
    outQuantity: number;
    outValue: number;
    netQuantity: number;
    netValue: number;
    closingQuantity: number;
    closingValue: number;
    averageCost: number;
}

// ============================================================================
// 2. Stock Transfer Report
// ============================================================================
export interface StockTransferReportSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    fromWarehouseId: number | null;
    toWarehouseId: number | null;
    status: StockTransferStatus | null;
    mode: StockTransferMode | null;
    productId: string | null;
    productVariantId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockTransferReportData {
    fromDate: Date;
    toDate: Date;
    filterFromWarehouse: string;
    filterToWarehouse: string;
    filterStatus: string;
    totalTransfers: number;
    totalLines: number;
    totalShippedQuantity: number;
    totalReceivedQuantity: number;
    totalInTransitQuantity: number;
    totalTransferValue: number;
    fulfillmentRate: number;
    transfers: CursorPaginationResult<StockTransferReportItemData>;
}

export interface StockTransferReportItemData {
    id: string;
    createdAt: Date;
    transferId: string;
    transferNumberDisplay: string;
    transferDate: Date;
    mode: string;
    status: string;
    fromWarehouseName: string;
    toWarehouseName: string;
    sku: string;
    productName: string;
    variantName: string;
    uom: string;
    shippedQuantity: number;
    receivedQuantity: number;
    inTransitQuantity: number;
    unitCost: number;
    totalCost: number;
    remarks: string | null;
}

// ============================================================================
// 3. Stock Adjustment Report
// ============================================================================
export interface StockAdjustmentReportSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    warehouseId: number | null;
    reason: StockAdjustmentReason | null;
    status: StockAdjustmentStatus | null;
    adjustmentType: StockAdjustmentType | null;
    productId: string | null;
    productVariantId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockAdjustmentReportData {
    fromDate: Date;
    toDate: Date;
    filterWarehouse: string;
    filterReason: string;
    filterStatus: string;
    totalAdjustments: number;
    totalLines: number;
    totalIncreaseQuantity: number;
    totalIncreaseValue: number;
    totalDecreaseQuantity: number;
    totalDecreaseValue: number;
    netAdjustmentQuantity: number;
    netAdjustmentValue: number;
    adjustments: CursorPaginationResult<StockAdjustmentReportItemData>;
}

export interface StockAdjustmentReportItemData {
    id: string;
    createdAt: Date;
    adjustmentId: string;
    adjustmentNumberDisplay: string;
    adjustmentDate: Date;
    reason: string;
    status: string;
    warehouseName: string;
    sku: string;
    productName: string;
    variantName: string;
    uom: string;
    systemQuantity: number;
    countedQuantity: number;
    differenceQuantity: number;
    adjustmentType: string;
    unitCost: number;
    totalCost: number;
    remarks: string | null;
}

// ============================================================================
// 4. Outward Movement Report
// ============================================================================
export interface OutwardMovementReportSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    warehouseId: number | null;
    sourceType: StockSourceType | null;
    excludeTransfers: boolean | null;
    productId: string | null;
    productVariantId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface OutwardMovementReportData {
    fromDate: Date;
    toDate: Date;
    filterWarehouse: string;
    filterSourceType: string;
    totalMovements: number;
    totalQuantity: number;
    totalValue: number;
    salesOrderValue: number;
    transferOutValue: number;
    purchaseReturnValue: number;
    adjustmentOutValue: number;
    otherOutValue: number;
    movements: CursorPaginationResult<OutwardMovementReportItemData>;
}

export interface OutwardMovementReportItemData {
    id: string;
    createdAt: Date;
    date: Date;
    documentNo: string;
    sourceType: string;
    warehouseName: string;
    locationName: string | null;
    sku: string;
    productName: string;
    variantName: string;
    uom: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    remarks: string | null;
}