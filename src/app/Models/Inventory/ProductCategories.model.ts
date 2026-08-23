export interface ProductCategoriesDropdownDto {
    id: number;
    name: string;
    level: number;
    displayName?: string;
    code: string;
    parentCategoryId: number | null;
}
export interface ProductCategoriesDto {
    name: string;
    description: string;
    code: string;
    isActive: boolean;
    parentCategoryId: number | null;
    inventoryAccountId: number | null;
    salesAccountId: number | null;
    costOfGoodsSoldAccountId: number | null;
}
export interface ProductCategoriesTreeView {
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    parentCategoryId: number | null;
    level: number;
    hasChildren: boolean;
}
export interface ProductCategoriesList {
    id: number;
    isActive: boolean;
    code: string;
    description: string;
    name: string;
    createdAt: Date;
}
export interface ProductCategoriesSearch {
    id: number | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}