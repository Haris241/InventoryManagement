import { ModuleLayoutConfig } from './nav-config.model';

export const BLOGS_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'BLOGS',

    menuGroups: [
        {
            key: 'gettingStarted',
            icon: 'rocket_launch',
            label: 'Getting Started',
            directRoute: '/Docs/gettingStarted'
        },

        {
            key: 'COA',
            icon: 'account_balance',
            label: 'Chart Of Account',
            children: [
                {
                    label: 'What is Chart of Account?',
                    route: '/Docs/coa'
                },
                {
                    label: 'How to Import COA?',
                    route: '/Docs/importCOA'
                }
            ]
        },

        {
            key: 'vouchersGuide',
            icon: 'receipt_long',
            label: 'Vouchers Guide',
            directRoute: '/Docs/vouchersGuide'
        },

        {
            key: 'fiscalyearGuide',
            icon: 'date_range',
            label: 'Fiscal Year Guide',
            directRoute: '/Docs/fiscalyearGuide'
        }
    ]
};