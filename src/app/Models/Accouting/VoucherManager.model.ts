export interface CreateJournalEntry {
    voucherType: VoucherType;
    postingDate: string | null;
    postingDateUI: Date;
    narration: string;
    category: JournalCategory;
    sourceType: SourceType;
    sourceId: string | null;
    lines: CreateJournalEntryLine[];
}
export interface CreateJournalEntryLine {
    chartOfAccountId: number | null;
    description: string;
    debit: number;
    credit: number;
    currencyCode: string;
    exchangeRate: number;
    relatedEntityId: string | null;
    referenceNo: string;
}
export interface AccountingLine {
    debit?: number;
    credit?: number;
    exchangeRate?: number;
}
export interface JournalEntrySearchDto {
    accountId: number | null;
    voucherId: number | null;
    voucherType: VoucherType | null;
    fromDate: Date | null;
    toDate: Date | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface JournalEntryListDto {
    id: number;
    voucherNo: number;
    voucherType: VoucherType;
    postingDate: Date;
    narration: string;
    totalDebit: number;
    totalCredit: number;
    createdAt: Date;
}


export enum JournalCategory {
    Normal = 1,
    Opening = 2,
    Closing = 3,
    Adjustment = 4
}
export enum SourceType {
    Manual = 1,
    SalesInvoice = 2,
    PurchaseOrder = 3
}
export enum VoucherType {
    Journal = 1,
    Opening = 2,
    CashPayment = 3,
    CashReceipt = 4,
    BankPayment = 5,
    BankReceipt = 6,
    Contra = 7,
    Purchase = 8,
    Sales = 9
}
