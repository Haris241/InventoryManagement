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
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    {
        path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
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
                path: 'accountReports', data: { module: 'Accounts' }, loadComponent: () => import('./shared/report-layout/report-layout.component').then(m => m.ReportLayoutComponent)
            },
            {
                path: 'fiscalyear', loadComponent: () => import('./features/AccountsModule/fiscalyear/fiscalyear.component').then(m => m.FiscalyearComponent)
            },
            {
                path: 'clientSetting', loadComponent: () => import('./shared/client-setting/client-setting.component').then(m => m.ClientSettingComponent)
            },
            {
                path: 'coa', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountAdd/chart-of-account.component').then(m => m.ChartOfAccountComponent)
            },
            {
                path: 'coaList', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountList/coalist.component').then(m => m.COAListComponent)
            },
            {
                path: 'coaTree', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountTree/coa-tree.component').then(m => m.CoaTreeComponent)
            },
            {
                path: 'coaEdit/:id', loadComponent: () => import('./features/AccountsModule/COA/ChartOfAccountEdit/coa-edit.component').then(m => m.CoaEditComponent)
            },
            {
                path: 'voucherManager', loadComponent: () => import('./features/AccountsModule/VoucherManager/AddVoucher/voucher-manger.component').then(m => m.VoucherMangerComponent), children: [
                    {
                        path: 'jv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/jv-voucher/jv-voucher.component').then(m => m.JvVoucherComponent)
                    },
                    {
                        path: 'cpv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/cpv-voucher/cpv-voucher.component').then(m => m.CpvVoucherComponent)
                    },
                    {
                        path: 'bpv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/bpv-voucher/bpv-voucher.component').then(m => m.BpvVoucherComponent)
                    },
                    {
                        path: 'crv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/crv-voucher/crv-voucher.component').then(m => m.CrvVoucherComponent)
                    },
                    {
                        path: 'brv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/brv-voucher/brv-voucher.component').then(m => m.BrvVoucherComponent)
                    },
                    {
                        path: 'cv', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/cv-voucher/cv-voucher.component').then(m => m.CvVoucherComponent)
                    },
                    {
                        path: '', redirectTo: 'jv', pathMatch: 'full'
                    }
                ]
            },
            {
                path: 'jvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/jv-voucher/jv-voucher.component').then(m => m.JvVoucherComponent)
            },
            {
                path: 'cpvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/cpv-voucher/cpv-voucher.component').then(m => m.CpvVoucherComponent)
            },
            {
                path: 'bpvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/bpv-voucher/bpv-voucher.component').then(m => m.BpvVoucherComponent)
            },
            {
                path: 'crvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/crv-voucher/crv-voucher.component').then(m => m.CrvVoucherComponent)
            },
            {
                path: 'brvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/brv-voucher/brv-voucher.component').then(m => m.BrvVoucherComponent)
            },
            {
                path: 'cvEdit/:id', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherTypes/cv-voucher/cv-voucher.component').then(m => m.CvVoucherComponent)
            },
            {
                path: 'voucherList', loadComponent: () => import('./features/AccountsModule/VoucherManager/VoucherList/voucher-list.component').then(m => m.VoucherListComponent)
            },
            //Report Paths
            {
                path: 'accountReports/generalLedger', loadComponent: () => import('./features/AccountsModule/AccountsReport/general-ledger/general-ledger.component').then(m => m.GeneralLedgerComponent)
            },
            {
                path: 'accountReports/fullAccountStatement', loadComponent: () => import('./features/AccountsModule/AccountsReport/full-account-statement/full-account-statement.component').then(m => m.FullAccountStatementComponent)
            },
            {
                path: 'accountReports/trialBalance', loadComponent: () => import('./features/AccountsModule/AccountsReport/trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent)
            },
            {
                path: 'accountReports/balancesheet', loadComponent: () => import('./features/AccountsModule/AccountsReport/balance-sheet/balance-sheet.component').then(m => m.BalanceSheetComponent)
            },
            {
                path: '', redirectTo: 'accountdashboard', pathMatch: 'full'
            }
        ]
    }
];
