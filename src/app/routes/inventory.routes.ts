import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
    {
        path: 'Inventory',
        loadComponent: () => import('../features/InventoryModule/layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('../features/InventoryModule/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('../features/InventoryModule/ProductTab/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'addproduct',
                loadComponent: () => import('../features/InventoryModule/ProductTab/add-product/add-product.component').then(m => m.AddProductComponent)
            },
            {
                path: 'editproduct/:id',
                loadComponent: () => import('../features/InventoryModule/ProductTab/add-product/add-product.component').then(m => m.AddProductComponent)
            },
            {
                path: 'suppliers',
                loadComponent: () => import('../features/InventoryModule/SupplierTab/suppliers/suppliers.component').then(m => m.SuppliersComponent)
            },
            {
                path: 'addsupplier',
                loadComponent: () => import('../features/InventoryModule/SupplierTab/add-supplier/add-supplier.component').then(m => m.AddSupplierComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
