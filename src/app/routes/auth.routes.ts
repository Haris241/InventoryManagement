import { Routes } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { AuthComponent } from '../auth/auth/auth.component';

export const authRoutes: Routes = [
    // Home page — the public landing page (entry point)
    {
        path: '',
        loadComponent: () => import('../home/home.component').then(m => m.HomeComponent)
    },
    // Login page — nested inside AuthComponent layout
    {
        path: '',
        component: AuthComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent
            }
        ]
    },
    {
        path: 'register',
        loadComponent: () => import('../auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'modules',
        loadComponent: () => import('../auth/modules-layout/modules-layout.component').then(m => m.ModulesLayoutComponent)
    },
    // Public pages — implement content when ready
    {
        path: 'about',
        loadComponent: () => import('../about/about.component').then(m => m.AboutComponent)
    },
    {
        path: 'contact',
        loadComponent: () => import('../contact/contact.component').then(m => m.ContactComponent)
    }
];
