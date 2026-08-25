export interface WareHouseDto {
    id?: number;
    name: string;
    code: string;
    isActive: boolean;
    description: string;
    address: string;
    city: string;
    country: string;
    managerName: string;
    phone: string;
    locations: WarehouseLocationDto[];
}
export interface WarehouseLocationDto {
    id?: number;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
}
export interface WareHouseList {
    id: number;
    name: string;
    description: string;
    code: string;
    isActive: boolean;
    city: string;
    country: string;
    managerName: string;
    phone: string;
    createdAt: Date;
}
export interface WareHouseSearch {
    id: number | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}