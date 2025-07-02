import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './modules/auth/login/login';
import { ProvidersPage } from './pages/providers/providers';


export const routes: Routes = [

    { 
        path: '', 
        component: LoginComponent // Login como página principal
    },
    { 
        path: 'home', // Ahora el home/dashboard tiene su propia ruta
        component: HomeComponent
    },

    {
        path: 'home-providers',
        component:ProvidersPage

    },
    { 
        path: 'auth', 
        loadChildren: () => import('./modules/auth/auth-module').then(m => m.AuthModule) 
    },
    { 
        path: 'events', 
        loadChildren: () => import('./modules/event-management/event-management-module').then(m => m.EventManagementModule) 
    },
    { 
        path: 'inventory', 
        loadChildren: () => import('./modules/inventory/inventory-module').then(m => m.InventoryModule) 
    },
    { 
        path: 'reports', 
        loadChildren: () => import('./modules/reports/reports-module').then(m => m.ReportsModule) 
    },
    { 
        path: 'staff', 
        loadChildren: () => import('./modules/staff/staff-module').then(m => m.StaffModule) 
    },
    { 
        path: 'users', 
        loadChildren: () => import('./modules/user-management/user-management-module').then(m => m.UserManagementModule) 
    },
    { 
        path: 'provider', 
        loadChildren: () => import('./modules/provider/provider-module').then(m => m.ProviderModule) 
    },

    { path: '**', redirectTo: '' } // Ruta comodín para 404
];