import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';


export const routes: Routes = [

    { path: '', component: HomeComponent },
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
    { path: '**', redirectTo: '' } // Ruta comodín para 404
];