import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { Component } from '@angular/core';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { SuppliersComponent } from './features/suppliers/suppliers.component';
import { AddProductComponent } from './features/add-product/add-product.component';
import { AddSupplierComponent } from './add-supplier/add-supplier.component';
import { EditProductComponent } from './edit-product/edit-product.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthComponent } from './authlayout/auth/auth.component';

export const routes: Routes = [
    {
        path:'', component: AuthComponent, children: [
            {
                path:'login', component: LoginComponent
            },
            {
                path:'register', component: RegisterComponent
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
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
                path:'', redirectTo:'login', pathMatch:'full'
            }
        ]
    }
];
