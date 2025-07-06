import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersPage } from './components/providers/providers';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
import { EventsPage } from './components/events-page/events-page';
import { DashboardUsersComponent } from './components/dashboard-users/dashboard-users';
const routes: Routes = [

  { path: '', // Ruta relativa a '/pages'
    redirectTo: 'principal', pathMatch: 'full' },
  { path: 'principal', component: DashboardComponent },
  { path: 'usuarios', component: DashboardUsersComponent },

  { path: 'principal', component: DashboardComponent },
  { path: 'home-providers', component: ProvidersPage },
  { path: 'inventory-page', component: InventoryPageComponent },
  { path: 'contracts-page', component: ContractsPage},
  { path: 'events-page', component: EventsPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
