import { Routes } from '@angular/router';
import { SETTING_LAYOUT_CONFIG } from '../shared/GlobalLayout/ConfigFiles/setting-layout.config';
export const settingRoutes: Routes = [
    {
        path: 'Setting',
        data: { layoutConfig: SETTING_LAYOUT_CONFIG },
        loadComponent: () => import('../shared/GlobalLayout/Component/globallayout.component').then(m => m.GloballayoutComponent),
        children: [
            {
                path: 'clientSetting',
                loadComponent: () => import('../features/SettingModule/client-setting/client-setting.component').then(m => m.ClientSettingComponent)
            },
            {
                path: 'inventoryWorkflow',
                loadComponent: () => import('../features/SettingModule/InventoryWorkFlow/inventoryworlflow.component').then(m => m.InventoryworlflowComponent)
            }
        ]
    }
];
