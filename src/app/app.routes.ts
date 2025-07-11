import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';

export const routes: Routes = [
    {
        path:'', component:LayoutComponent, children: [
            {
                path:'dashboard', component:DashboardComponent
            },
            {
                path:'products', component:ProductsComponent
            },
            {
                path:'suppliers', component:SuppliersComponent
            },
            {
                path:'', redirectTo:'dashboard', pathMatch:'full'
            }
        ]
    }
];
