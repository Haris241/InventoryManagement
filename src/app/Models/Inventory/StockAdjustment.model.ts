import { AutoDropdown } from "../Pagination.model";
import { ProductVariantSearchDto } from "./ProductSearch.model";

export interface StockAdjustmentDto {
    id?: string;
    name: string;
    adjustmentDate: string;
    adjustmentDateUI: Date | null;
    remarks: string;
    reason: StockAdjustmentReason | null;
    warehouseId: number | null;
    lines: StockAdjustmentLineDto[];
}
export interface StockAdjustmentLineDto {
    id?: string;
    productVariantId: string | null;
    selectedProductVariant?: ProductVariantSearchDto;
    productName: string;
    barcode: string;
    uom: string;
    countedQuantity: number;
    availableQuantity?: number | null;
    warehouseLocationId: number | null;
    remarks: string;
}
export interface StockAdjustmentList {
    id?: string;
    name: string;
    adjustmentNumber: string;
    adjustmentDate: Date;
    warehouseName: string;
    reason: StockAdjustmentReason;
    status: StockAdjustmentStatus;
    totalIncreaseValue: number;
    totalDecreaseValue: number;
    createdAt: Date;
}
export interface StockAdjustmentSearch {
    id: string | null;
    warehouseId: number | null;
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    status: StockAdjustmentStatus | null;
    reason: StockAdjustmentReason | null;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface StockAdjustmentFormLookupsDto {
    warehouses: AutoDropdown[];
    enableBarcode: boolean;
    enableLocations: boolean;
}
export enum StockAdjustmentReason {
    PhysicalCount = 0,
    Damaged = 1,
    Expired = 2,
    LostOrTheft = 3,
    Found = 4,
    OpeningBalance = 5,
    Other = 6
}
export enum StockAdjustmentStatus {
    Draft = 0,
    Approved = 1,
    Cancelled = 2
}
