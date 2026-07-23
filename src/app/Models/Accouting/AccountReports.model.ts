import { CursorPaginationResult } from "../Pagination.model";
import { VoucherType } from "./VoucherManager.model";

export interface GeneralLedgerData {
    accountName: string;
    fromDate: Date;
    toDate: Date;
    openingBalance: BalanceData;
    closingBalance: BalanceData;
    transactions: GeneralLedgerLineData[];
}

export interface GeneralLedgerLineData {
    postingDate: Date;
    voucherNo: string;
    voucherType: string;
    narration: string;
    referenceNo: string;
    baseDebit: number;
    baseCredit: number;
    runningBalance: BalanceData;
}

export interface GeneralLederSearch {
    accountId: number | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
}
export interface AccountStatemnetSearch {
    accountId: number | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;
}

export interface FullAccountStatementData {
    accountName: string;
    fromDate: Date;
    toDate: Date;
    openingBalance: BalanceData;
    closingBalance: BalanceData;
    transactions: CursorPaginationResult<FullAccountLineData>;
}

export interface FullAccountLineData {
    postingDate: Date;
    createdAt: Date;
    voucherNo: string;
    voucherType: string;
    narration: string;
    referenceNo: string;
    baseDebit: number;
    baseCredit: number;
    runningBalance: BalanceData;
}

export interface TrialBalanceSearch {
    accountId: number | null;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
}
export interface TrialBalanceData {
    fromDate: Date;
    toDate: Date;
    totalDebit: number;
    totalCredit: number;
    accounts: CursorPaginationResult<TrialBalanceLineData>;

}
export interface TrialBalanceLineData {
    createdAt: Date;
    accountId: number;
    accountName: string;
    accountCode: string;
    accountGroupName: string;
    baseDebit: number;
    baseCredit: number;

}
export interface BalanceData {
    amount: number;
    balanceType: string;
}
