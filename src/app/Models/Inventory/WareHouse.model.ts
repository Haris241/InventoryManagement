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