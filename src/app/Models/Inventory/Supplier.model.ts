export interface SupplierDto {
    id?: string;
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    isActive: boolean;
    chartOfAccountId: number | null;
    chartOfAccountName: string | null;
}

export interface SupplierSearch {
    id: string | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}
export interface SupplierListDto {
    id: string;
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    isActive: boolean;
    chartOfAccountName: string;
    createdAt: Date;
}