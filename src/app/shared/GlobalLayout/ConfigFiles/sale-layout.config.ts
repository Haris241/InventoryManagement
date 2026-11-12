import { ModuleLayoutConfig } from './nav-config.model';

export const SALES_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'Sales',
    menuGroups: [
        { key: 'dashboard', icon: 'bar_chart', label: 'DashBoard', directRoute: '/Sales/salesdashboard' },
        { key: 'reports', icon: 'assignment', label: 'Reports', directRoute: '/Sales/salesReports' },

        {
            key: 'Customer', icon: 'description', label: 'Customer',
            children: [
                { label: 'Add Customer', route: '/Sales/voucherManager' },
                { label: 'Customer List', route: '/Sales/voucherList' },
            ]
        }
    ]
};