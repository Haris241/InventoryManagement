import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { AuthComponent } from '../auth/auth/auth.component';

export const authRoutes: Routes = [
    {
        path: '',
        component: AuthComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    {
        path: 'register',
        loadComponent: () => import('../auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'modules',
        loadComponent: () => import('../auth/modules-layout/modules-layout.component').then(m => m.ModulesLayoutComponent)
    }
];
