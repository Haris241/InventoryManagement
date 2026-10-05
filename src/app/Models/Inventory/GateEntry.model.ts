import { AutoDropdown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";

export interface GateEntryDto {
    id?: string;
    name: string;
    description: string;
    entryDate: string | null;
    entryDateUI: Date | null;
    vehicleNumber: string;
    driverName: string;
    driverContact: string;
    supplierId: string | null;
    sourceModule: GateEntrySourceModule | null;
    lines: GateEntryLineDto[];
}
export interface GateEntryLineDto {
    id?: string;
    quantity: number;
    wareHouseId: string | null;
    warehouseName: string;
    productVariantId: string | null;
    productVariantName: string;
    barcode: string;
    uom: string;
    sourceRowId: string | null;
    availableQuantity: number | null;
    selectedProductVariant?: ProductVariantSearchDto;

}
export interface GateEntryList {
    id: string;
    name: string;
    gateEntryNumber: string;
    supplierName: string;
    entryDate: Date;
    status: GateEntryStatus;
    fulfillmentStatus: GateEntryFulfillmentStatus;
    sourceModule: string;
    totalQuantity: number;
    recievedQuantity: number;
    createdAt: Date;
}
export interface GateEntrySearch {
    id: string | null;
    supplierId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: GateEntryStatus | null;
    fulfillmentStatus: GateEntryFulfillmentStatus | null;
    sourceModule: GateEntrySourceModule | null;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface GEFormLookupsDto {
    warehouses: AutoDropdown[];
    suppliers: AutoDropdown[];
    enableBarcode: boolean;
}
export enum GateEntrySourceModule {
    General = 0,
    PurchaseOrder = 1
}
export enum GateEntryFulfillmentStatus      // physical / conversion lifecycle
{
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}
export enum GateEntryStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}