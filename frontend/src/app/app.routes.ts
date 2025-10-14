import { Routes } from '@angular/router';


export const routes: Routes = [

    { 
        path: '', 
        redirectTo: 'auth/login', 
        pathMatch: 'full' 
    },

    {
        path: 'pages',
        loadChildren: () => import('./pages/pages-module').then(m => m.PagesModule)
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
    { 
        path: 'contracts', 
        loadChildren: () => import('./modules/contracts/contracts-module').then(m => m.ContractsModule) 
    },

    { path: '**', redirectTo: 'auth/login' } // Ruta comodín para 404
];