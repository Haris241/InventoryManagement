import { Routes } from '@angular/router';

export const docsRoutes: Routes = [
    {
        path: 'Docs',
        loadComponent: () => import('../Docs/Layout/doclayout.component').then(m => m.DoclayoutComponent),
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
                path: '',
                redirectTo: 'gettingStarted',
                pathMatch: 'full'
            }
        ]
    }
];
