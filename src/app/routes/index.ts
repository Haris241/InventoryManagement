import { Routes } from '@angular/router';
import { accountsRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { docsRoutes } from './docs.routes';
import { inventoryRoutes } from './inventory.routes';

export const routes: Routes = [
    ...authRoutes,
    ...inventoryRoutes,
    ...accountsRoutes,
    ...docsRoutes
];
