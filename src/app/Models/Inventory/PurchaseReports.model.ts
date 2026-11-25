

// ============================================================================
// 1. Purchase Analysis

import { CursorPaginationResult } from "../Pagination.model";
import { PurchaseReturnReason } from "./PurchaseRetrun.model";

// ============================================================================
export interface PurchaseAnalysisSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    productId: string | null;
    productVariantId: string | null;
    productCategoryId: number | null;
    warehouseId: number | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface PurchaseAnalysisData {
    totalOrders: number;
    totalItems: number;
    totalQuantity: number;
    totalReceivedQuantity: number;
    totalSubTotal: number;
    totalDiscountAmount: number;
    totalTaxAmount: number;
    totalGrandTotal: number;
    averageOrderValue: number;
    filterSupplier: string;
    filterWarehouse: string;
    filterCategory: string;
    dateRange: string;
    items: CursorPaginationResult<PurchaseAnalysisItemData>;
}

export interface PurchaseAnalysisItemData {
    purchaseOrderId: string;
    purchaseNumber: string;
    purchaseDate: Date;
    supplierId: string;
    supplierName: string;
    productId: string;
    productNumber: string;
    productName: string;
    productVariantId: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    warehouseId: number;
    warehouseName: string;
    quantity: number;
    receivedQuantity: number;
    rate: number;
    discountPercentage: number;
    discountAmount: number;
    taxAmount: number;
    lineTotal: number;
    fulfillmentStatus: string;
    createdAt: Date;
}

// ============================================================================
// 2. Purchase Order Outstanding
// ============================================================================
export interface PurchaseOrderOutstandingSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    warehouseId: number | null;
    productId: string | null;
    productVariantId: string | null;
    overdueOnly: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface PurchaseOrderOutstandingData {
    totalOrders: number;
    totalLines: number;
    totalOrderedQuantity: number;
    totalReceivedQuantity: number;
    totalOutstandingQuantity: number;
    totalOutstandingAmount: number;
    totalOverdueLines: number;
    filterSupplier: string;
    filterWarehouse: string;
    dateRange: string;
    items: CursorPaginationResult<PurchaseOrderOutstandingItemData>;
}

export interface PurchaseOrderOutstandingItemData {
    purchaseOrderId: string;
    purchaseNumber: string;
    purchaseDate: Date;
    expectedDeliveryDate: Date | null;
    daysOverdue: number;
    isOverdue: boolean;
    supplierId: string;
    supplierName: string;
    warehouseId: number;
    warehouseName: string;
    productId: string;
    productNumber: string;
    productName: string;
    productVariantId: string;
    variantName: string;
    sku: string;
    uom: string;
    orderedQuantity: number;
    receivedQuantity: number;
    outstandingQuantity: number;
    rate: number;
    outstandingAmount: number;
    fulfillmentStatus: string;
    createdAt: Date;
}

// ============================================================================
// 3. GRN Pending Invoice
// ============================================================================
export interface GrnPendingInvoiceSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    warehouseId: number | null;
    productId: string | null;
    productVariantId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface GrnPendingInvoiceData {
    totalGrns: number;
    totalLines: number;
    totalAcceptedQuantity: number;
    totalInvoicedQuantity: number;
    totalPendingQuantity: number;
    totalPendingAmount: number;
    filterSupplier: string;
    filterWarehouse: string;
    dateRange: string;
    items: CursorPaginationResult<GrnPendingInvoiceItemData>;
}

export interface GrnPendingInvoiceItemData {
    grnId: string;
    grnNumber: string;
    grnDate: Date;
    daysSinceReceipt: number;
    purchaseOrderId: string | null;
    purchaseOrderNumber: string | null;
    supplierId: string;
    supplierName: string;
    warehouseId: number;
    warehouseName: string;
    productId: string;
    productNumber: string;
    productName: string;
    productVariantId: string;
    variantName: string;
    sku: string;
    uom: string;
    acceptedQuantity: number;
    returnedQuantity: number;
    invoicedQuantity: number;
    pendingQuantity: number;
    rate: number;
    pendingAmount: number;
    grnPostingStatus: string;
    createdAt: Date;
}

// ============================================================================
// 4. Three-Way Match (PO vs GRN vs Invoice)
// ============================================================================
export interface ThreeWayMatchSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    purchaseOrderId: string | null;
    varianceOnly: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface ThreeWayMatchData {
    totalLines: number;
    exactMatchCount: number;
    discrepancyCount: number;
    pendingReceiptCount: number;
    pendingInvoiceCount: number;
    totalPoAmount: number;
    totalGrnAmount: number;
    totalInvoiceAmount: number;
    netVarianceAmount: number;
    filterSupplier: string;
    dateRange: string;
    items: CursorPaginationResult<ThreeWayMatchItemData>;
}

export interface ThreeWayMatchItemData {
    purchaseOrderId: string;
    purchaseNumber: string;
    purchaseDate: Date;
    supplierId: string;
    supplierName: string;
    productId: string;
    productNumber: string;
    productName: string;
    productVariantId: string;
    variantName: string;
    sku: string;
    uom: string;

    // Purchase Order
    poQuantity: number;
    poRate: number;
    poAmount: number;

    // Goods Received Note
    grnNumbers: string;
    grnQuantity: number;
    grnRate: number;
    grnAmount: number;

    // Purchase Invoice
    invoiceNumbers: string;
    invoiceQuantity: number;
    invoiceRate: number;
    invoiceAmount: number;

    // Variances
    quantityVariance: number;
    priceVariance: number;
    amountVariance: number;
    matchStatus: string;

    createdAt: Date;
}

// ============================================================================
// 5. Supplier Purchase Summary
// ============================================================================
export interface SupplierPurchaseSummarySearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    activeOnly: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface SupplierPurchaseSummaryData {
    totalSuppliers: number;
    totalOrders: number;
    totalPoAmount: number;
    totalInvoicedAmount: number;
    totalReturnedAmount: number;
    totalNetSpend: number;
    dateRange: string;
    items: CursorPaginationResult<SupplierPurchaseSummaryItemData>;
}

export interface SupplierPurchaseSummaryItemData {
    supplierId: string;
    supplierCode: string;
    supplierName: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    totalOrdersCount: number;
    totalOrderAmount: number;
    totalGrnCount: number;
    totalGrnAmount: number;
    totalInvoiceCount: number;
    totalInvoiceAmount: number;
    totalReturnCount: number;
    totalReturnAmount: number;
    netSpend: number;
    averageOrderValue: number;
    createdAt: Date;
}

// ============================================================================
// 6. Supplier Delivery Performance (OTIF)
// ============================================================================
export interface SupplierDeliveryPerformanceSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface SupplierDeliveryPerformanceData {
    totalSuppliers: number;
    totalOrders: number;
    totalDeliveries: number;
    overallOnTimeRate: number;
    overallFulfillmentRate: number;
    overallQualityAcceptanceRate: number;
    overallOtifRate: number;
    dateRange: string;
    items: CursorPaginationResult<SupplierDeliveryPerformanceItemData>;
}

export interface SupplierDeliveryPerformanceItemData {
    supplierId: string;
    supplierCode: string;
    supplierName: string;
    totalOrdersCount: number;
    deliveredOrdersCount: number;
    totalDeliveriesCount: number;
    onTimeDeliveriesCount: number;
    lateDeliveriesCount: number;
    onTimeRatePercentage: number;
    averageDelayDays: number;
    totalOrderedQuantity: number;
    totalDeliveredQuantity: number;
    totalAcceptedQuantity: number;
    totalRejectedQuantity: number;
    fulfillmentRatePercentage: number;
    qualityAcceptanceRatePercentage: number;
    otifPercentage: number;
    performanceGrade: string;
    createdAt: Date;
}

// ============================================================================
// 7. Purchase Return Analysis
// ============================================================================
export interface PurchaseReturnAnalysisSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    supplierId: string | null;
    warehouseId: number | null;
    productId: string | null;
    productVariantId: string | null;
    reason: PurchaseReturnReason | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface PurchaseReturnAnalysisData {
    totalReturns: number;
    totalLines: number;
    totalReturnedQuantity: number;
    totalReturnedValue: number;
    totalTaxAmount: number;
    damagedValue: number;
    qualityIssueValue: number;
    wrongItemValue: number;
    excessValue: number;
    otherValue: number;
    filterSupplier: string;
    filterWarehouse: string;
    filterReason: string;
    dateRange: string;
    items: CursorPaginationResult<PurchaseReturnAnalysisItemData>;
}

export interface PurchaseReturnAnalysisItemData {
    purchaseReturnId: string;
    returnNumber: string;
    returnDate: Date;
    supplierId: string;
    supplierName: string;
    warehouseId: number;
    warehouseName: string;
    productId: string;
    productNumber: string;
    productName: string;
    productVariantId: string;
    variantName: string;
    sku: string;
    categoryName: string;
    uom: string;
    returnedQuantity: number;
    rate: number;
    taxAmount: number;
    lineTotal: number;
    reason: string;
    reasonDisplay: string;
    reasonNote: string | null;
    sourceModule: string;
    createdAt: Date;
}