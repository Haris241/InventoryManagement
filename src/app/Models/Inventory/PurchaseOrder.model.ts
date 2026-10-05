import { AutoDropdown, TaxDropDown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";


// Main DTO for Create / Edit Form
export interface PurchaseOrderDto {
    id?: string;
    name: string;
    description: string;
    purchaseDate: string | null;
    purchaseDateUI: Date | null;
    expectedDeliveryDate: string | null;
    expectedDeliveryDateUI: Date | null;
    paymentTerms: string;
    deliveryTerms: string;
    supplierId: string | null;
    sourceModule: PurchaseOrderSourceModule;
    lines: PurchaseOrderLineDto[];
}

// Line Item DTO
export interface PurchaseOrderLineDto {
    id?: string;
    quantity: number;
    rate: number;
    discountPercentage: number;
    taxId: number | null;
    wareHouseId: number | null;
    warehouseName: string;
    warehouseLocationId: number | null;
    warehouseLocationName: string;
    productVariantId: string | null;
    selectedProductVariant?: ProductVariantSearchDto;
    productName: string;
    barcode: string;
    uom: string;
    sourceRowId: string | null;
    availableQuantity: number | null;
}


// Lookups for Forms
export interface POFormLookupsDto {
    warehouses: AutoDropdown[];
    suppliers: AutoDropdown[];
    taxes: TaxDropDown[];
    postingPoint: boolean;
    enableBarcode: boolean;
    enableLocations: boolean
}

// Search Filter DTO
export interface PurchaseOrderSearch {
    id: string | null;
    supplierId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: PurchaseOrderStatus | null;
    fulfillmentStatus: PurchaseOrderFulfillmentStatus | null;
    sourceModule: PurchaseOrderSourceModule | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

// Table / List DTO
export interface PurchaseOrderList {
    id: string;
    supplierName: string;
    name: string;
    purchaseNumber: string;
    date: Date;
    status: PurchaseOrderStatus;
    fulfillmentStatus: PurchaseOrderFulfillmentStatus;
    sourceModule: string;
    totalQuantity: number;
    recievedQuantity: number;
    grandTotal: number;
    createdAt: Date;
}

// Enums
export enum PurchaseOrderStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}

export enum PurchaseOrderFulfillmentStatus {
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}

export enum PurchaseOrderSourceModule {
    General = 0,
    PurchaseRequisition = 1
}