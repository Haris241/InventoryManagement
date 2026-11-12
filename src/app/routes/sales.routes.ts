import { Routes } from '@angular/router';
import { SALES_LAYOUT_CONFIG } from '../shared/GlobalLayout/ConfigFiles/sale-layout.config';
export const salesRoutes: Routes = [
    {
        path: 'Sales',
        data: { layoutConfig: SALES_LAYOUT_CONFIG },
        loadComponent: () => import('../shared/GlobalLayout/Component/globallayout.component').then(m => m.GloballayoutComponent),
        children: [
            {
                path: 'salesdashboard',
                loadComponent: () => import('../features/SaleModule/SaleDashboard/sale-dashboard.component').then(m => m.SaleDashboardComponent)
            },
            {
                path: 'salesReports',
                data: { module: 'Sales' },
                loadComponent: () => import('../shared/report-layout/report-layout.component').then(m => m.ReportLayoutComponent)
            },
            {
                path: 'customerAdd',
                loadComponent: () => import('../features/SaleModule/Customer/CustomerAddUpdate/customer-add-update.component').then(m => m.CustomerAddUpdateComponent)
            },
            {
                path: 'customerEdit/:id',
                loadComponent: () => import('../features/SaleModule/Customer/CustomerAddUpdate/customer-add-update.component').then(m => m.CustomerAddUpdateComponent)
            },
            {
                path: 'CustomerList',
                loadComponent: () => import('../features/SaleModule/Customer/CustomerList/customer-list.component').then(m => m.CustomerListComponent)
            },

            {
                path: '',
                redirectTo: 'salesdashboard',
                pathMatch: 'full'
            }
        ]
    }
];
