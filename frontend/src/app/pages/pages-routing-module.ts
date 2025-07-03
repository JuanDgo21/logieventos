import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersPage } from './components/providers/providers';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
const routes: Routes = [
  
  { path: 'principal', component: DashboardComponent },
  { path: 'home-providers', component: ProvidersPage },
  { path: 'inventory-page', component: InventoryPageComponent },
  { path: 'contracts-page', component: ContractsPage}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
