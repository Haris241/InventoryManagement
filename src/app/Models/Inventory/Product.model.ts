import { AutoDropdown } from "../Pagination.model";

export interface ProductDTO {
    id?: string;
    productName: string;
    productNumber: string;
    productDescription: string;
    uom: UOM | null;
    productType: ProductType | null;
    taxRate: number | null;
    isActive: boolean;
    productCategoryId: number | null;
    productCategoryName?: string;
    brandId: number | null;
    brandName?: string;
    variants: ProductVariantDto[];
}

export interface ProductVariantDto {
    id?: string;
    productId?: string;
    sku: string;
    barcode: string | null;
    description: string | null;
    costPrice: number;
    sellingPrice: number;
    netWeight: number | null;
    grossWeight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    imageUrl?: string | null;
    image?: File;
    isActive: boolean;
    removedImage: boolean;
    attributeValues: ProductAttributeValueDto[];
    initialStock: WareHouseStockDto[];
}

export interface ProductAttributeValueDto {
    attributeDefinitionId?: number | null;
    attributeName?: string;
    attributeValueId?: number | null;
    value?: string;
}

export interface WareHouseStockDto {
    warehouseId: number | null;
    warehouseLocationId: number | null;
    warehouseName: string;
    warehouseLocationName: string;
    quantity: number;
    unitCost: number;
}

export interface ProductSearchDTO {
    productId: string | null;
    productType: ProductType | null;
    productCategoryId: number | null;
    brandId: number | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface ProductListDTO {
    id: string;
    productName: string;
    productNumber: string;
    productNumberInteger: number;
    productType: string;
    uom: string;
    productCategory: string;
    brand: string;
    isActive: boolean;
    createdAt: Date;
    variantCount: number;
    totalAvailableStock: number
}
export enum UOM {
    Piece = 1,
    Kilogram = 2,
    Gram = 3,
    Liter = 4,
    Milliliter = 5,
    Meter = 6,
    Centimeter = 7,
    Inch = 8,
    Foot = 9,
    Yard = 10,
    Pack = 11,
    Box = 12,
    Dozen = 13
}
export enum ProductType {
    Finished = 1,
    Raw = 2,
    Service = 3,
    SemiFinished = 4,
    Parts = 5

}
export interface AttributeDefinitionDropdown {
    id: number;
    name: string;
    values: AttributeValueOption[];
}
export interface AttributeValueOption {
    id: number;
    value: string;
    code: string;
}

export interface ProductFormLookups {
    warehouses: AutoDropdown[];
    categories: AutoDropdown[];
    brands: AutoDropdown[];
    attributeDefinitions: AttributeDefinitionDropdown[];
}

