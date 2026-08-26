export interface BrandDto {
    id?: number;
    name: string;
    slug: string;
    isActive: boolean;
    description: string;
    logoUrl?: File;
    logoUrlString?: string;
}
export interface BrandList {
    id: number;
    name: string;
    description: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
}
export interface BrandSearch {
    id: number | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}