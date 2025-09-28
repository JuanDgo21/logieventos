import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersPageComponent } from './components/providers/providers';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
import { DashboardUsersComponent } from './components/dashboard-users/dashboard-users';
import { DashboardStaffComponent } from './components/dashboard-staff/dashboard-staff';
import { EventPageComponent } from './components/event-page/event-page';
import { EventTypeComponent } from './components/event-type/event-type';

const routes: Routes = [

  { path: '', // Ruta relativa a '/pages'
    redirectTo: 'principal', pathMatch: 'full' },
  { path: 'principal', component: DashboardComponent },
  { path: 'usuarios', component: DashboardUsersComponent },
  { path: 'personal', component: DashboardStaffComponent },

  { path: 'home-providers', component: ProvidersPageComponent },
  { path: 'inventory-page', component: InventoryPageComponent },
  { path: 'contracts-page', component: ContractsPage},
  { path: 'events-page', component: EventPageComponent },
  { path: 'event-types', component: EventTypeComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
