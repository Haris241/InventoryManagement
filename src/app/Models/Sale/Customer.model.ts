export interface CustomerDto {
    id?: string;
    name: string;
    code: string;
    customerType: CustomerType;
    contactPerson: string;
    email: string;
    phone: string;
    website: string;
    billingAddress: string;
    billingCity: string;
    billingCountry: string;
    shippingAddress: string;
    shippingCity: string;
    shippingCountry: string;
    ntn: string;
    strn: string;
    isTaxExempt: boolean;
    creditLimit: number;
    creditDays: number;
    isCreditAllowed: boolean;
    isActive: boolean;
    chartOfAccountId: number | null;
    chartOfAccountName: string | null;
}

export interface CustomerSearch {
    id: string | null;
    isActive: boolean;
    customerType: CustomerType | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface CustomerList {
    id: string;
    name: string;
    code: string;
    customerType: string;
    email: string;
    phone: string;
    creditLimit: number;
    creditDays: number;
    isCreditAllowed: boolean;
    isActive: boolean;
    chartOfAccountName: string;
    createdAt: Date;
}

export enum CustomerType {
    Business = 1,
    Individual = 2
}