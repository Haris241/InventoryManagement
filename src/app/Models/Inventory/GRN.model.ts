import { AutoDropdown, TaxDropDown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";

export interface GRNDto {
    id?: string;
    name: string;
    dateUI: Date | null;
    date: string | null;
    description: string;
    supplierId: string | null;
    sourceModule: GRNSourceModule | null;
    lines: GRNLineDto[];


}
export interface GRNLineDto {
    id?: string;
    acceptedQuantity: number;
    rejectedQuantity: number;
    rejectedReason: string;
    rate: number;
    discountPercentage: number;
    taxId: number | null;
    wareHouseId: number | null;
    warehouseName: string;
    warehouseLocationId: number | null;
    warehouseLocationName: string;
    productVariantId: string | null;
    productVariantName: string
    barcode: string;
    uom: string;
    sourceRowId: string | null;
    availableQuantity: number | null;
    selectedProductVariant?: ProductVariantSearchDto;
    isPOBasedGE: boolean
}
export interface GRNList {
    id: string;
    name: string;
    supplierName: string;
    grnNumber: string;
    date: Date;
    status: GRNStatus;
    fulfillmentStatus: GRNFulfillmentStatus;
    sourceModule: string;
    totalQuantity: number;
    acceptedQuantity: number;
    grandTotal: number;
    createdAt: Date;
}
export interface GRNSearch {
    id: string | null;
    supplierId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: GRNStatus | null;
    fulfillmentStatus: GRNFulfillmentStatus | null;
    sourceModule: GRNSourceModule | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface GRNFormLookupsDto {
    warehouses: AutoDropdown[];
    suppliers: AutoDropdown[];
    taxes: TaxDropDown[];
    requirePOForGRN: boolean;
    enableBarcode: boolean;
    enableLocations: boolean;

}
export enum GRNSourceModule {
    General = 0,
    GateEntry = 1,
    PurchaseOrder = 2
}
export enum GRNFulfillmentStatus      // physical / conversion lifecycle
{
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}
export enum GRNStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}