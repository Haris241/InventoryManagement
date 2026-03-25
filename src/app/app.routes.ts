import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthComponent } from './auth/auth/auth.component';
import { authGuard } from './auth/Guards/auth.guard';
import { guestGuard } from './auth/Guards/guest.guard';


export const routes: Routes = [
    {
        //Auth Routes
        path: '', component: AuthComponent, children: [
            {
                path: 'login', component: LoginComponent
            },
            {
                path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    {
        //Modules Layout
        path: 'modules', loadComponent: () => import('./auth/modules-layout/modules-layout.component').then(m => m.ModulesLayoutComponent)

    },
    {
        //Inventory Module
        path: 'Inventory', loadComponent: () => import('./features/InventoryModule/layout/layout.component').then(m => m.LayoutComponent), children: [
            {
                path: 'dashboard', loadComponent: () => import('./features/InventoryModule/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'products', loadComponent: () => import('./features/InventoryModule/ProductTab/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'addproduct', loadComponent: () => import('./features/InventoryModule/ProductTab/add-product/add-product.component').then(m => m.AddProductComponent)
            },
            {
                path: 'editproduct/:id', loadComponent: () => import('./features/InventoryModule/ProductTab/add-product/add-product.component').then(m => m.AddProductComponent)
            },
            {
                path: 'suppliers', loadComponent: () => import('./features/InventoryModule/SupplierTab/suppliers/suppliers.component').then(m => m.SuppliersComponent)
            },
            {
                path: 'addsupplier', loadComponent: () => import('./features/InventoryModule/SupplierTab/add-supplier/add-supplier.component').then(m => m.AddSupplierComponent)
            },
            {
                path: '', redirectTo: 'dashboard', pathMatch: 'full'
            }
        ]
    },
    {
        //Accounts Module
        path: 'Accounts', loadComponent: () => import('./features/AccountsModule/accountlayout/accountlayout.component').then(m => m.AccountlayoutComponent), children: [
            {
                path: 'accountdashboard', loadComponent: () => import('./features/AccountsModule/account-dashboard/account-dashboard.component').then(m => m.AccountDashboardComponent)
            },
            {
                path: 'fiscalyear', loadComponent: () => import('./features/AccountsModule/fiscalyear/fiscalyear.component').then(m => m.FiscalyearComponent)
            },
            {
                path: 'coa', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountAdd/chart-of-account.component').then(m => m.ChartOfAccountComponent)
            },
            {
                path: 'coaList', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountList/coalist.component').then(m => m.COAListComponent)
            },
            {
                path: '', redirectTo: 'accountdashboard', pathMatch: 'full'
            }
        ]
    }
];
