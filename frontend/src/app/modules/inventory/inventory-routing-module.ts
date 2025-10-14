import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResourcesComponent } from './resources/resources';
import { ResourceTypesComponent } from './resource-types/resource-types';

const routes: Routes = [
  { path: 'resources', component: ResourcesComponent },
  { path: 'resource-types', component: ResourceTypesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
