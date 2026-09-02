import { AutoDropdown } from "../Pagination.model";

export interface ProductAttributeValueDto {
    id?: number;
    attributeDefinitionId: number | null;
    value: string;
    code: string;
    isActive: boolean;
    selectedAttributeDefinition?: AutoDropdown;
}
export interface ProductAttributeValueSearch {
    id: number | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface ProductAttributeValueList {
    id: number;
    isActive: boolean;
    value: string;
    code: string;
    attributeDefinitionName: string;
    createdAt: Date;
}