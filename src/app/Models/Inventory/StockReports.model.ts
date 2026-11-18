import { CursorPaginationResult } from "../Pagination.model";

export enum SlowNonMovingStockStatus {
    All = 0,
    NonMoving = 1,
    SlowMoving = 2
}

export enum ReorderStockStatus {
    All = 0,
    OutOfStock = 1,
    LowStock = 2
}

// ============================================================================
// 1. Stock Ledger
// ============================================================================
export interface StockLedgerSearch {
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockLedgerData {
    productName: string;
    variantName: string;
    sku: string;
    uom: string;
    warehouseName: string;
    locationName: string | null;
    locationsEnabled: boolean;
    fromDate: Date;
    toDate: Date;
    openingQuantity: number;
    openingValue: number;
    totalInQuantity: number;
    totalInValue: number;
    totalOutQuantity: number;
    totalOutValue: number;
    closingQuantity: number;
    closingValue: number;
    transactions: CursorPaginationResult<StockLedgerLineData>;
}

export interface StockLedgerLineData {
    id: string;
    createdAt: Date;
    date: Date;
    voucherType: string;
    documentNo: string;
    movementType: string;
    inQuantity: number;
    outQuantity: number;
    unitCost: number;
    totalCost: number;
    runningQuantity: number;
    runningValue: number;
    warehouseName: string;
    locationName: string | null;
    remarks: string | null;
}

// ============================================================================
// 2. Current Stock
// ============================================================================
export interface CurrentStockSearch {
    productId: string | null;
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    productCategoryId: number | null;
    brandId: number | null;
    includeZeroStock: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface CurrentStockData {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    filterWarehouse: string;
    filterCategory: string;
    locationsEnabled: boolean;
    items: CursorPaginationResult<CurrentStockItemData>;
}

export interface CurrentStockItemData {
    productId: string;
    productVariantId: string;
    productNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    barcode: string | null;
    categoryName: string;
    brandName: string | null;
    uom: string;
    warehouseId: number;
    warehouseName: string;
    locationId: number | null;
    locationName: string | null;
    quantity: number;
    averageCost: number;
    totalValue: number;
    createdAt: Date;
}

// ============================================================================
// 3. Stock Valuation
// ============================================================================
export interface StockValuationSearch {
    productId: string | null;
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    productCategoryId: number | null;
    brandId: number | null;
    asOfDate: string | null;
    asOfDateUI: Date | null;
    includeZeroStock: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockValuationData {
    asOfDate: Date;
    totalItems: number;
    totalQuantity: number;
    totalValuation: number;
    filterWarehouse: string;
    filterCategory: string;
    valuationMethod: string;
    locationsEnabled: boolean;
    items: CursorPaginationResult<StockValuationItemData>;
}

export interface StockValuationItemData {
    productId: string;
    productVariantId: string;
    productNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    warehouseName: string;
    locationName: string | null;
    quantity: number;
    unitCost: number;
    totalValue: number;
    createdAt: Date;
}

// ============================================================================
// 4. Stock Aging
// ============================================================================
export interface StockAgingSearch {
    productId: string | null;
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    productCategoryId: number | null;
    brandId: number | null;
    asOfDate: string | null;
    asOfDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface StockAgingData {
    asOfDate: Date;
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    totalQty0To30: number;
    totalValue0To30: number;
    totalQty31To60: number;
    totalValue31To60: number;
    totalQty61To90: number;
    totalValue61To90: number;
    totalQty91To180: number;
    totalValue91To180: number;
    totalQtyOver180: number;
    totalValueOver180: number;
    filterWarehouse: string;
    filterCategory: string;
    locationsEnabled: boolean;
    items: CursorPaginationResult<StockAgingItemData>;
}

export interface StockAgingItemData {
    productId: string;
    productVariantId: string;
    productNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    warehouseName: string;
    locationName: string | null;
    currentQuantity: number;
    averageCost: number;
    totalValue: number;
    qty0To30: number;
    value0To30: number;
    qty31To60: number;
    value31To60: number;
    qty61To90: number;
    value61To90: number;
    qty91To180: number;
    value91To180: number;
    qtyOver180: number;
    valueOver180: number;
    createdAt: Date;
}

// ============================================================================
// 5. Slow & Non-Moving Stock
// ============================================================================
export interface SlowNonMovingStockSearch {
    productId: string | null;
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    productCategoryId: number | null;
    daysThreshold: number;
    statusFilter: SlowNonMovingStockStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface SlowNonMovingStockData {
    asOfDate: Date;
    daysThreshold: number;
    totalItems: number;
    nonMovingCount: number;
    slowMovingCount: number;
    totalNonMovingValue: number;
    totalSlowMovingValue: number;
    totalQuantity: number;
    totalValue: number;
    filterWarehouse: string;
    filterCategory: string;
    locationsEnabled: boolean;
    items: CursorPaginationResult<SlowNonMovingStockItemData>;
}

export interface SlowNonMovingStockItemData {
    productId: string;
    productVariantId: string;
    productNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    warehouseName: string;
    locationName: string | null;
    currentQuantity: number;
    averageCost: number;
    totalValue: number;
    lastMovementDate: Date | null;
    daysSinceLastMovement: number;
    outQuantityInPeriod: number;
    movementStatus: string;
    createdAt: Date;
}

// ============================================================================
// 6. Reorder / Low Stock
// ============================================================================
export interface ReorderStockSearch {
    productId: string | null;
    productVariantId: string | null;
    warehouseId: number | null;
    warehouseLocationId: number | null;
    productCategoryId: number | null;
    thresholdQuantity: number | null;
    statusFilter: ReorderStockStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface ReorderStockData {
    thresholdQuantity: number;
    totalItems: number;
    outOfStockCount: number;
    lowStockCount: number;
    totalShortageQuantity: number;
    estimatedReorderCost: number;
    filterWarehouse: string;
    filterCategory: string;
    locationsEnabled: boolean;
    items: CursorPaginationResult<ReorderStockItemData>;
}

export interface ReorderStockItemData {
    productId: string;
    productVariantId: string;
    productNumber: string;
    productName: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    warehouseName: string;
    locationName: string | null;
    currentQuantity: number;
    reorderThreshold: number;
    shortageQuantity: number;
    unitCost: number;
    estimatedCost: number;
    stockStatus: string;
    createdAt: Date;
}