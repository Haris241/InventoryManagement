import { BalanceData } from "./AccountReports.model";

export interface AccountDashBoardData {
    totalCash: BalanceData;
    totalBank: BalanceData;
    totalRevenue: BalanceData;
    totalExpenses: BalanceData;
    netProfit: BalanceData;
    topAccountsPayable: AccountBalanceData[];
    topAccountsReceivable: AccountBalanceData[];
    revenueExpenseTrend: RevenueExpenseTrendPoint[];
    expenseBreakdown: CategoryBreakdownItem[];
}
export interface AccountBalanceData {
    name: string;
    balance: BalanceData;
}
export interface RevenueExpenseTrendPoint {
    period: string;
    revenue: number;
    expense: number;
}
export interface CategoryBreakdownItem {
    accountId: number;
    categoryName: string;
    amount: number;
}

export interface AccountsDashBoardSearch {
    filterType?: AccountDashboardFilterType | null;
    refresh?: boolean;
}
export enum AccountDashboardFilterType {
    Today = 1,
    ThisWeek = 2,
    ThisMonth = 3,
    SixMonth = 4
}