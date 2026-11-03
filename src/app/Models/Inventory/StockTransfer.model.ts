import { AutoDropdown } from "../Pagination.model";

export interface StockTransferDto {
    id?: string;
    name: string;
    transferDate: string
    transferDateUI: Date | null;
    remarks: string;
    mode: StockTransferMode;
    fromWarehouseId: number | null;
    toWarehouseId: number | null;
    lines: StockTransferLineDto[];
}
export interface StockTransferLineDto {
    id?: string;
    productVariantId: string | null;
    productName: string;
    barcode: string;
    uom: string;
    quantity: number;
    receivedQuantity: number;
    availableQuantity: number;
    fromWarehouseLocationId: number | null;
    toWarehouseLocationId: number | null;
    remarks: string;

}
export interface StockTransferListDto {
    id?: string;
    name: string;
    transferNumber: string;
    transferDate: Date;
    fromWarehouseName: string;
    toWarehouseName: string;
    mode: StockTransferMode;
    status: StockTransferStatus;
    totalQuantity: number;
    receivedQuantity: number;
    totalCost: number;
    createdAt: Date;
}
export interface StockTransferSearchDto {
    id: string | null;
    fromWarehouseId: number | null;
    toWarehouseId: number | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: StockTransferStatus | null;
    mode: StockTransferMode | null;
    nextCursor: string | null;
    previousCursor: string | null;

}
export interface StockTransferFormLookupsDto {
    warehouses: AutoDropdown[];
    enableBarcode: boolean;
    enableLocations: boolean;
}
export enum StockTransferMode {
    Direct = 0,
    TwoStep = 1
}
export enum StockTransferStatus {
    Draft = 0,
    Approved = 1,
    PartiallyReceived = 2,
    Received = 3,
    Cancelled = 4
}