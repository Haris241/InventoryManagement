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
                path: 'productcategorieslist',
                loadComponent: () => import('../features/InventoryModule/ProductCategories/ProductCategoriesList/product-categories-list.component').then(m => m.ProductCategoriesListComponent)
            },
            {
                path: 'productcategoriestree',
                loadComponent: () => import('../features/InventoryModule/ProductCategories/ProductCategoriesTree/product-categories-tree.component').then(m => m.ProductCategoriesTreeComponent)
            },
            {
                path: 'addproductcategory',
                loadComponent: () => import('../features/InventoryModule/ProductCategories/ProductCategories/product-categories.component').then(m => m.ProductCategoriesComponent)
            },
            {
                path: 'editproductcategory/:id',
                loadComponent: () => import('../features/InventoryModule/ProductCategories/ProductCategories/product-categories.component').then(m => m.ProductCategoriesComponent)
            },
            {
                path: 'warehouselist',
                loadComponent: () => import('../features/InventoryModule/WareHouse/warehous-list/warehous-list.component').then(m => m.WarehousListComponent)
            },
            {
                path: 'addwarehouse',
                loadComponent: () => import('../features/InventoryModule/WareHouse/WareHouseAddUpdate/warehouse.component').then(m => m.WarehouseComponent)
            },
            {
                path: 'editwarehouse/:id',
                loadComponent: () => import('../features/InventoryModule/WareHouse/WareHouseAddUpdate/warehouse.component').then(m => m.WarehouseComponent)
            },

            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    }
];
