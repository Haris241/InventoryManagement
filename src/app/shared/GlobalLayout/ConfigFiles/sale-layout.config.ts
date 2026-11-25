import { ModuleLayoutConfig } from './nav-config.model';

export const SALES_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'Sales',
    menuGroups: [
        { key: 'dashboard', icon: 'bar_chart', label: 'DashBoard', directRoute: '/Sales/salesdashboard' },
        { key: 'reports', icon: 'assignment', label: 'Reports', directRoute: '/Sales/salesReports' },

        {
            key: 'Customer', icon: 'person', label: 'Customer',
            children: [
                { label: 'Add Customer', route: '/Sales/customerAdd' },
                { label: 'Customer List', route: '/Sales/CustomerList' },
            ]
        },
        {
            key: 'SaleOrder', icon: 'list', label: 'Sale Order',
            children: [
                { label: 'Add Sale Order', route: '/Sales/saleorderadd' },
                { label: 'Sale Order List', route: '/Sales/saleorderlist' },
            ]
        },
        {
            key: 'SaleInvoice', icon: 'receipt', label: 'Sale Invoice',
            children: [
                { label: 'Add Sale Invoice', route: '/Sales/saleinvoiceadd' },
                { label: 'Sale Invoice List', route: '/Sales/saleinvoicelist' },
            ]
        }
    ]
};