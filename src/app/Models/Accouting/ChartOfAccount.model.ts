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
    category: string;
    kind: string;
    isPostable: boolean;
    isSystem: boolean;
    createdAt: Date;
}
export interface UpdateCOAGET {
    id: number;
    isActive: boolean;
    code: number;
    name: string;
    category: string;
    kind: string;
}
export interface UpdateCOAPOST {
    isActive: boolean;
    name: string;
    deactivateChildren: boolean;
}

export interface COASearchDto {
    id: number | null;
    category: AccountType | null;
    kind: AccountKind | null;
    isActive: boolean;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface COATreeView {
    id: number;
    name: string;
    code: number;
    isActive: boolean;
    parentId?: number;
    level: number;
    hasChildren: boolean;
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

