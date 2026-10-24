import { AutoDropdown, TaxDropDown } from "../Pagination.model";

export interface PurchaseReturnDto {
    id?: string;
    name: string;
    dateUI: Date | null;
    date: string | null;
    description: string;
    supplierId: string | null;
    sourceModule: PurchaseReturnSourceModule | null;
    lines: PurchaseReturnLineDto[];

}
export interface PurchaseReturnLineDto {
    id?: string;
    quantity: number;
    rate: number;
    taxId: number | null;
    reason: string | null;
    reasonNote: string | null;
    wareHouseId: number | null;
    warehouseName: string;
    warehouseLocationId: number | null;
    warehouseLocationName: string;
    productVariantId: string | null;
    productName: string;
    barcode: string;
    uom: string;
    sourceRowId: string | null;
    availableQuantity: number | null;
    supplierId?: string | null;

}
export interface PurchaseReturnList {
    id: string;
    name: string;
    purchaseReturnNumber: string;
    supplierName: string;
    date: string;
    status: PurchaseReturnStatus;
    sourceModule: string;
    totalQuantity: number;
    grandTotal: number;
    fulfillmentStatus: PurchaseReturnFulfillmentStatus;
    createdAt: string;
}
export interface PurchaseReturnSearch {
    id: string | null;
    supplierId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: PurchaseReturnStatus | null;
    sourceModule: PurchaseReturnSourceModule | null;
    fulfillmentStatus: PurchaseReturnFulfillmentStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;

}
export interface PurchaseReturnFormLookupsDto {
    suppliers: AutoDropdown[];
    taxes: TaxDropDown[];
    enableLocations: boolean;

}
export enum PurchaseReturnSourceModule {
    PurchaseOrder = 0,
    GRN = 1,
    PurchaseInvoice = 2
}
export enum PurchaseReturnStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}
export enum PurchaseReturnFulfillmentStatus      // physical / conversion lifecycle
{
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}
