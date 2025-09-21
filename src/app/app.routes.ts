import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthComponent } from './auth/auth/auth.component';
import { ProductsComponent } from './features/Product Tab/products/products.component';
import { AddProductComponent } from './features/Product Tab/add-product/add-product.component';
import { SuppliersComponent } from './features/Supplier Tab/suppliers/suppliers.component';
import { AddSupplierComponent } from './features/Supplier Tab/add-supplier/add-supplier.component';
import { authGuard } from './auth/Guards/auth.guard';
import { guestGuard } from './auth/Guards/guest.guard';


export const routes: Routes = [
    {
        path:'', component: AuthComponent,children: [
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
        path:'Inventory', component:LayoutComponent, children: [
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
                path:'', redirectTo:'login', pathMatch:'full'
            }
        ]
    }
];
