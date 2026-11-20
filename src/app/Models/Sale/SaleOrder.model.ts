import { ProductVariantSearchDto } from "../Inventory/ProductSearch.model";
import { AutoDropdown, TaxDropDown } from "../Pagination.model";
export interface SaleOrderDto {
    id?: string;
    customerId: string | null;
    orderDate: string | null;
    orderDateUI: Date | null;
    name: string;
    expectedDeliveryDate: string | null;
    expectedDeliveryDateUI: Date | null;
    description: string;
    billingAddress: string;
    shippingAddress: string;
    customerReference: string;
    customerName: string;
    lines: SaleOrderLineDto[];
}
export interface SaleOrderLineDto {
    id?: string;
    quantity: number;
    rate: number;
    discountPercentage: number;
    taxId: number | null;
    wareHouseId: number | null;
    warehouseLocationId: number | null;
    warehouseLocationName: string;
    productVariantId: string | null;
    productName: string;
    barcode: string;
    uom: string;
    availableQuantity: number | null;
    selectedProductVariant?: ProductVariantSearchDto;

}
export interface SaleOrderList {
    id: string;
    customerName: string;
    name: string;
    salesOrderNumberDisplay: string;
    orderDate: Date;
    status: SalesOrderStatus;
    fulfillmentStatus: SalesOrderFulfillmentStatus;
    invoicingStatus: SalesOrderInvoicingStatus;
    totalQuantity: number;
    deliveredQuantity: number;
    grandTotal: number;
    createdAt: Date;
}
export interface SaleOrderSearch {
    id: string | null;
    customerId: string | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: SalesOrderStatus | null;
    fulfillmentStatus: SalesOrderFulfillmentStatus | null;
    invoicingStatus: SalesOrderInvoicingStatus | null;
    nextCursor: string | null;
    previousCursor: string | null;

}
export interface SOFormLookupsDto {
    warehouses: AutoDropdown[];
    taxes: TaxDropDown[];
    enableNegativeStock: boolean;
    enableBarcode: boolean;
    enableLocations: boolean;
}
export enum SalesOrderStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}
export enum SalesOrderFulfillmentStatus {
    Open = 0,
    PartiallyFulfilled = 1,
    FullyFulfilled = 2,
    Cancelled = 3
}
export enum SalesOrderInvoicingStatus {
    Open = 0,
    PartiallyInvoiced = 1,
    FullyInvoiced = 2,
    Cancelled = 3
}