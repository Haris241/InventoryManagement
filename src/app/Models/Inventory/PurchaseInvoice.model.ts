import { AutoDropdown, TaxDropDown } from "../Pagination.model";

export interface PurchaseInvoiceDto {
    id: string;
    name: string;
    date: string | null;
    dateUI: Date | null;
    dueDate: string | null;
    dueDateUI: Date | null;
    description: string;
    supplierInvoiceNumber: string;
    supplierId: string | null;
    lines: PurchaseInvoiceLineDto[];
}
export interface PurchaseInvoiceLineDto {
    id?: string;
    quantity: number;
    rate: number;
    discountPercentage: number;
    taxId: number | null;
    wareHouseId: number | null;
    warehouseName: string;
    productVariantId: string | null;
    productVariantName: string
    barcode: string;
    uom: string;
    grnLineId: string | null;
    availableQuantity: number | null;
    supplierId?: string | null;
}
export interface PurchaseInvoiceList {
    id: string;
    name: string;
    supplierName: string;
    purchaseInvoiceNumber: string;
    date: Date;
    status: PurchaseInvoiceStatus;
    fulfillmentStatus: PurchaseInvoiceFulfillmentStatus;
    totalQuantity: number;
    grandTotal: number;
    createdAt: Date;
}
export interface PurchaseInvoiceSearch {
    id: string | null;
    supplierId: string | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    status: PurchaseInvoiceStatus | null;
    fulfillmentStatus: PurchaseInvoiceFulfillmentStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;

}
export interface PurchaseInvoiceFormLookupsDto {
    suppliers: AutoDropdown[];
    taxes: TaxDropDown[];

}
export enum PurchaseInvoiceStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}
export enum PurchaseInvoiceFulfillmentStatus {
    Open = 0,
    PartiallyReturned = 1,
    FullyReturned = 2,
    Cancelled = 3
}