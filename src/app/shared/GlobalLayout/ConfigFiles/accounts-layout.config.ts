import { ModuleLayoutConfig } from './nav-config.model';

export const ACCOUNTS_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'Accounts',
    menuGroups: [
        { key: 'dashboard', icon: 'bar_chart', label: 'DashBoard', directRoute: '/Accounts/accountdashboard' },
        { key: 'reports', icon: 'assignment', label: 'Reports', directRoute: '/Accounts/accountReports' },
        {
            key: 'COA', icon: 'account_balance', label: 'Chart Of Accounts',
            children: [
                { label: 'Add Chart of Account', route: '/Accounts/coa' },
                { label: 'Chart of Account List', route: '/Accounts/coaList' },
                { label: 'Chart of Account Tree', route: '/Accounts/coaTree' },
            ]
        },
        {
            key: 'Voucher', icon: 'description', label: 'Voucher Manager',
            children: [
                { label: 'Add Voucher', route: '/Accounts/voucherManager' },
                { label: 'Voucher List', route: '/Accounts/voucherList' },
            ]
        },
        {
            key: 'Settings', icon: 'rule_settings', label: 'Settings',
            children: [
                { label: 'Add Fiscal Year', route: '/Accounts/fiscalyear' },
                { label: 'Client Setting', route: '/Accounts/clientSetting' },
            ]
        },
    ]
};