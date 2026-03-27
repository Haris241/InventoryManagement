export interface CreateCOA {
    name: string,
    parentId: number | null,
    kind: AccountKind | null,
    category: AccountType | null,
    openingBalance: number
}

export interface COADropdownDto {
    id: number,
    name: string,
    level: number,
    displayName?: string,
    category?: AccountType,
    code: number,
    parentId?: number
}

export interface COAList {
    id: number;
    isActive: boolean;
    code: number;
    name: string;
    category: AccountType;
    kind: AccountKind;
    isPostable: boolean;
    isSystem: boolean;
    createdAt: Date;
}

export interface COASearchDto {
    id: number | null;
    category: AccountType | null;
    kind: AccountKind | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export enum AccountType {
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    Expense = 5
}

export enum BalanceType {
    Debit = 1,
    Credit = 2
}

export enum AccountKind {
    Group = 1,
    Ledger = 2
}

