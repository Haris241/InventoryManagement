import { AutoDropdown } from "../Pagination.model";

export interface JournalEntryDto {
    id?: number
    voucherType: VoucherType;
    postingDate: string;
    postingDateUI: Date;
    narration: string;
    category: JournalCategory;
    sourceType: SourceType;
    sourceId: string | null;
    lines: JournalEntryLineDto[];
}
export interface JournalEntryLineDto {
    chartOfAccountId: number | null;
    description: string;
    debit: number;
    credit: number;
    currencyCode: string | null;
    accountName: string;
    exchangeRate: number;
    relatedEntityId: string | null;
    referenceNo: string;
    isMainLine: boolean;
    selectedAccounts?: AutoDropdown;
}
export interface BankVoucherDto extends JournalEntryDto {
    bankName: string;
    bankAccountNumber: string;
    bankBranch: string;
    chequeNumber: string;
    chequeDate: string;
    chequeDateUI: Date | null;
    chequeStatus: ChequeStatus | null;
    paymentMode: string;
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
    fromDate: string | null;
    toDate: string | null;
    fromDateUI: Date | null;
    toDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface JournalEntryListDto {
    id: number;
    voucherNo: string;
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
export enum ChequeStatus {
    Issued = 1,
    Cleared = 2,
    Bounced = 3,
    Cancelled = 4,
    PostDated = 5
}
