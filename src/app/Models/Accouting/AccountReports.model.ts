import { CursorPaginationResult } from "../Pagination.model";

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
    accountGroupId: number | null;
    includeZeroBalance: boolean;
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    nextCursor: string | null;
    previousCursor: string | null;

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
export interface BalanceSheetSearch {
    asOfDate: string | null;
    asOfDateUI: Date | null;
    includeZeroBalance: boolean;
    showLedgerAccounts: boolean;
}
export interface BalanceSheetData {
    asOfDate: Date
    assets: BalanceSheetSectionData;
    liabilities: BalanceSheetSectionData;
    equity: BalanceSheetSectionData;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    difference: number;
}
export interface BalanceSheetNodeData extends ReportNode<BalanceSheetNodeData> { }
export interface BalanceSheetSectionData extends ReportSection<BalanceSheetNodeData> { }

export interface IncomeStatementSearch {
    fromDate: string | null;
    fromDateUI: Date | null;
    toDate: string | null;
    toDateUI: Date | null;
    includeZeroBalance: boolean;
    showLedgerAccounts: boolean;
}
export interface IncomeStatementData {
    fromDate: Date;
    toDate: Date;

    revenue: IncomeStatementSectionData;
    expense: IncomeStatementSectionData;

    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
}

export interface IncomeStatementNodeData extends ReportNode<IncomeStatementNodeData> { }
export interface IncomeStatementSectionData extends ReportSection<IncomeStatementNodeData> { }

export interface BalanceData {
    amount: number;
    balanceType: string;
}
export interface ReportNode<TNode> {
    accountId: number;
    accountCode: string;
    accountName: string;
    isLeaf: boolean;
    balance: number;
    children: TNode[];

    // UI only
    id?: string;
    level?: number;
    hasChildren?: boolean;
}
export interface ReportSection<TNode> {
    sectionName: string;
    nodes: TNode[];
    total: number;
}