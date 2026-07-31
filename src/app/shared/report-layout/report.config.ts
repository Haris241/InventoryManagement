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
                heading: 'Ledger Reports',
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
                        title: 'Trial Balance',
                        route: 'trialBalance'
                    },
                    {
                        title: 'Balance Sheet ',
                        route: 'balancesheet'
                    }
                ]
            },
            {
                heading: 'Financial Statements',
                reports: [
                    {
                        title: 'Income Statement (P&L)',
                        route: 'incomestatement'
                    },
                    {
                        title: 'Cash Flow Statement',
                        route: 'cashflowstatement'
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