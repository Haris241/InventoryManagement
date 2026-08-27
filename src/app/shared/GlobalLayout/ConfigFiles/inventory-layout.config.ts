import { ModuleLayoutConfig } from './nav-config.model';

export const INVENTORY_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'Inventory',

    menuGroups: [
        {
            key: 'dashboard',
            icon: 'bar_chart',
            label: 'DashBoard',
            directRoute: '/Inventory/dashboard'
        },

        {
            key: 'Product',
            icon: 'inventory_2',
            label: 'Product',
            children: [
                {
                    label: 'Add Product',
                    route: '/Inventory/addproduct'
                },
                {
                    label: 'Product List',
                    route: '/Inventory/products'
                },
                {
                    label: 'Add Product Categories',
                    route: '/Inventory/addproductcategory'
                },
                {
                    label: 'Product Categories List',
                    route: '/Inventory/productcategorieslist'
                },
                {
                    label: 'Product Categories Tree',
                    route: '/Inventory/productcategoriestree'
                }
            ]
        },

        {
            key: 'Warehouse',
            icon: 'store',
            label: 'Warehouse',
            children: [
                {
                    label: 'Add Warehouse',
                    route: '/Inventory/addwarehouse'
                },
                {
                    label: 'Warehouse List',
                    route: '/Inventory/warehouselist'
                }
            ]
        },

        {
            key: 'ProductSetup',
            icon: 'category',
            label: 'Product Setup',
            children: [
                {
                    label: 'Add Brand',
                    route: '/Inventory/addbrand'
                },
                {
                    label: 'Brands List',
                    route: '/Inventory/brandslist'
                }
            ]
        },

        {
            key: 'Supplier',
            icon: 'person',
            label: 'Supplier',
            children: [
                {
                    label: 'Add Supplier',
                    route: '/Inventory/addsupplier'
                },
                {
                    label: 'Supplier List',
                    route: '/Inventory/suppliers'
                }
            ]
        }
    ]
};