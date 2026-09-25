import { AutoDropdown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";

export interface PurchaseRequisitionDto {
    id?: string;
    name: string;
    date: string;
    dateUI: Date | null;
    description: string;
    departmentId: string | null;
    sourceModule: SourceModule;
    sourceId?: string;
    lines: PurchaseRequisitionLineDto[];
}
export interface PurchaseRequisitionLineDto {
    id?: string;
    quantity: number;
    wareHouseId: number | null;
    productVariantId: string | null;
    productVariantName?: string;
    sourceRowId?: string;
    selectedProductVariant?: ProductVariantSearchDto;
    uom: string;
    barcode: string;

}
export interface PurchaseRequisitionSearch {
    id: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: PurchaseRequisitionStatus | null;
    fulfillmentStatus: PurchaseRequisitionFulfillmentStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;
}
export enum SourceModule {
    General = 0,
    ProductionOrder = 1,   // future
    ExportOrder = 2,       // future
    SalesOrder = 3        // future
}
export interface PurchaseRequisitionList {
    id: string;
    name: string;
    requisitionNumber: string;
    date: Date;
    status: PurchaseRequisitionStatus;
    fulfillmentStatus: PurchaseRequisitionFulfillmentStatus;
    sourceModule: string;
    poCreated: string;
    totalQuantity: number;
    fulfillQuantity: number;
    createdAt: Date;
}
export interface PRFormLookupsDto {
    warehouses: AutoDropdown[];
    departments: AutoDropdown[];
    enableBarcode: boolean;

}
export enum PurchaseRequisitionStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}
export enum PurchaseRequisitionFulfillmentStatus {
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}
