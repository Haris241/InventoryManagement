import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthComponent } from './auth/auth/auth.component';
import { authGuard } from './auth/Guards/auth.guard';
import { guestGuard } from './auth/Guards/guest.guard';


export const routes: Routes = [
    {
        path:'', component: AuthComponent,children: [
            {
                path:'login', component: LoginComponent
            },
            {
                path:'register', loadComponent:()=> import('./auth/register/register.component').then(m=> m.RegisterComponent)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    {
        path:'Inventory', component:LayoutComponent, children: [
            {
                path:'dashboard', loadComponent:()=> import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent)
            },
            {
                path:'products', loadComponent:()=> import('./features/ProductTab/products/products.component').then(m=>m.ProductsComponent)
            },
            {
                path:'addproduct', loadComponent:()=> import('./features/ProductTab/add-product/add-product.component').then(m=> m.AddProductComponent)
            },
            {
                path:'editproduct/:id', loadComponent:()=> import('./features/ProductTab/add-product/add-product.component').then(m=> m.AddProductComponent)
            },
            {
                path:'suppliers', loadComponent:()=> import('./features/SupplierTab/suppliers/suppliers.component').then(m=>m.SuppliersComponent)
            },
            {
                path:'addsupplier', loadComponent:()=> import('./features/SupplierTab/add-supplier/add-supplier.component').then(m=>m.AddSupplierComponent)
            },
            {
                path:'', redirectTo:'dashboard', pathMatch:'full'
            }
        ]
    }
];
