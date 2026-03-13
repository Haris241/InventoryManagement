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
    category?: AccountType
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

//  [HttpGet("COAList")]
