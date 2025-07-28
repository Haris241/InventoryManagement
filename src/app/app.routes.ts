import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';
import { AddProductComponent } from './features/add-product/add-product.component';
import { AddSupplierComponent } from './add-supplier/add-supplier.component';
import { EditProductComponent } from './edit-product/edit-product.component';

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
                path:'addproduct', component: AddProductComponent
            },
            {
                path:'suppliers', component:SuppliersComponent
            },
            {
                path:'addsupplier', component: AddSupplierComponent
            },
            {
                path:'editproduct', component: EditProductComponent
            },
            {
                path:'', redirectTo:'dashboard', pathMatch:'full'
            }
        ]
    }
];
