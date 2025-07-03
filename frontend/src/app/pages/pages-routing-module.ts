import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { ProvidersPage } from './components/providers/providers';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
const routes: Routes = [
  { path: 'principal', component: Dashboard },
  { path: 'home-providers', component: ProvidersPage },
  { path: 'inventory-page', component: InventoryPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
