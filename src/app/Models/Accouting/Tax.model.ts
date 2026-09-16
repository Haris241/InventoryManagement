export interface TaxDto {
    id?: number | null;
    name: string;
    description: string;
    rate: number;
    isRecoverable: boolean;
    isActive: boolean;
}

export interface TaxSearch {
    id?: number | null;
    isActive: boolean;
    nextCursor?: string | null;
    previousCursor?: string | null;
}
export interface TaxList {
    id: number;
    name: string;
    description: string;
    rate: number;
    isRecoverable: boolean;
    isActive: boolean;
    createdAt: Date;
}