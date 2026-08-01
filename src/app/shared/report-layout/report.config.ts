export interface ReportItem {
    title: string;
    route: string;
    icon?: string;
}

export interface ReportSection {
    heading: string;
    reports: ReportItem[];
}

export interface ModuleReports {
    module: string;
    sections: ReportSection[];
}

export const REPORT_CONFIG: ModuleReports[] = [
    {
        module: 'Accounts',
        sections: [
            {
                heading: 'Ledger & Transaction Reports',
                reports: [
                    {
                        title: 'General Ledger',
                        route: 'generalLedger'
                    },
                    {
                        title: 'Full Account Statement',
                        route: 'fullAccountStatement'
                    },
                    {
                        title: 'Cash Bank Book',
                        route: 'cashbankbook'
                    },
                    {
                        title: 'Day Book',
                        route: 'daybook'
                    }
                ]
            },
            {
                heading: 'Financial Reports',
                reports: [
                    {
                        title: 'Trial Balance',
                        route: 'trialBalance'
                    },
                    {
                        title: 'Income Statement (P&L)',
                        route: 'incomestatement'
                    },
                    {
                        title: 'Balance Sheet',
                        route: 'balancesheet'
                    },
                    {
                        title: 'Cash Flow Statement',
                        route: 'cashflowstatement'
                    }
                ]
            }

        ]
    },
    {
        module: 'Inventory',
        sections: [
            {
                heading: 'Stock Reports',
                reports: [
                    {
                        title: 'Stock Ledger',
                        route: 'stockLedger'
                    },
                    {
                        title: 'Current Stock',
                        route: 'currentStock'
                    }
                ]
            }
        ]
    }
];