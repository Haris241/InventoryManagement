export interface CreateJournalEntry {
    voucherType: VoucherType;
    postingDate: Date;
    narration: string;
    category: JournalCategory;
    sourceType: SourceType;
    sourceId: string;
    lines: CreateJournalEntryLine[];
}
export interface CreateJournalEntryLine {
    chartOfAccountId: number;
    description: string;
    debit: number;
    credit: number;
    currencyCode: string;
    exchangeRate: number;
    relatedEntityId: string;
    referenceNo: string;
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