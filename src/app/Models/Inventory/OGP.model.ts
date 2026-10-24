import { AutoDropdown, TaxDropDown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";

export interface OutwardGatePassDto {
    id?: string;
    name: string;
    description: string;
    exitDateTime: string;
    exitDateTimeUI: Date | null;
    destinationAddress: string;
    recipientName: string;
    vehicleNumber: string;
    driverName: string;
    driverContact: string;
    transporterName: string;
    remarks: string;
    customerId: string | null;
    supplierId: string | null;
    sourceModule: OutwardGatePassSourceModule;
    isStockImpacting: boolean;
    lines: OutwardGatePassLineDto[];

}
export interface OutwardGatePassLineDto {
    id?: string;
    quantity: number;
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
    selectedProductVariant?: ProductVariantSearchDto;

}

export interface OutwardGatePassList {
    id: string;
    name: string;
    gatePassNumberDisplay: string;
    partyName: string;
    exitDateTime: Date;
    status: GatePassStatus;
    fulfillmentStatus: GatePassFulfillmentStatus;
    sourceModule: string;
    totalQuantity: number;
    dispatchedQuantity: number;
    vehicleNumber: string;
    createdAt: Date;

}
export interface OutwardGatePassSearch {
    id: string | null;
    customerId: string | null;
    supplierId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: GatePassStatus | null;
    fulfillmentStatus: GatePassFulfillmentStatus | null;
    sourceModule: OutwardGatePassSourceModule | null;
    nextCursor: string | null;
    previousCursor: string | null;

}
export interface OGPFormLookupsDto {
    warehouses?: AutoDropdown[];
    suppliers: AutoDropdown[];
    taxes: TaxDropDown[];
    enableLocations: boolean;
    enableBarcode: boolean;
}
export enum OutwardGatePassSourceModule {
    General = 0,
    SalesOrder = 1,
    PurchaseReturn = 2
}
export enum GatePassStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}

export enum GatePassFulfillmentStatus {
    Open = 0,
    PartiallyFulfilled = 1,
    Fulfilled = 2,
    Cancelled = 3
}
