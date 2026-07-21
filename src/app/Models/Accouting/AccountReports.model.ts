import { VoucherType } from "./VoucherManager.model";

export interface GeneralLedgerData {
    accountName: string;
    fromDate: Date;
    toDate: Date;
    openingBalance: number;
    closingBalance: number;
    transactions: GeneralLedgerLineData[];
}

export interface GeneralLedgerLineData {
    postingDate: Date;
    voucherNo: string;
    voucherType: VoucherType;
    narration: string;
    referenceNo: string;
    baseDebit: number;
    baseCredit: number;
    runningBalance: number;
}

export interface GeneralLederSearch {
    accountId: number | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
}
