import { Routes } from '@angular/router';
import { BLOGS_LAYOUT_CONFIG } from '../shared/GlobalLayout/ConfigFiles/docs-layout.config';

export const docsRoutes: Routes = [
    {
        path: 'Docs',
        data: { layoutConfig: BLOGS_LAYOUT_CONFIG },
        loadComponent: () => import('../shared/GlobalLayout/Component/globallayout.component').then(m => m.GloballayoutComponent),
        children: [
            {
                path: 'gettingStarted',
                loadComponent: () => import('../Docs/GettingStarted/gettingstarted.component').then(m => m.GettingstartedComponent)
            },
            {
                path: 'coa',
                loadComponent: () => import('../Docs/ChartOfAccount/what-is-coa/what-is-coa.component').then(m => m.WhatIsCoaComponent)
            },
            {
                path: 'importCOA',
                loadComponent: () => import('../Docs/ChartOfAccount/import-coa/import-coa.component').then(m => m.ImportCoaComponent)
            },
            {
                path: 'vouchersGuide',
                loadComponent: () => import('../Docs/Vouchers/voucher-blog.component').then(m => m.VoucherBlogComponent)
            },
            {
                path: 'fiscalyearGuide',
                loadComponent: () => import('../Docs/FiscalYear/fiscal-year-blog.component').then(m => m.FiscalYearBlogComponent)
            },
            {
                path: '',
                redirectTo: 'gettingStarted',
                pathMatch: 'full'
            }
        ]
    }
];
