import { ModuleLayoutConfig } from './nav-config.model';

export const SETTING_LAYOUT_CONFIG: ModuleLayoutConfig = {
    moduleLabel: 'Setting',
    menuGroups: [
        {
            key: 'ClientSetting', icon: 'settings', label: 'Client Setting', directRoute: '/Setting/clientSetting'
        },
        {
            key: 'InventoryWorkflow', icon: 'inventory', label: 'Inventory Workflow', directRoute: '/Setting/inventoryWorkflow'
        }
    ]
};