import { Routes } from '@angular/router';
import { accountsRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { docsRoutes } from './docs.routes';
import { inventoryRoutes } from './inventory.routes';
import { salesRoutes } from './sales.routes';
import { settingRoutes } from './setting.routes';

export const routes: Routes = [
    ...authRoutes,
    ...inventoryRoutes,
    ...salesRoutes,
    ...accountsRoutes,
    ...settingRoutes,
    ...docsRoutes
];
