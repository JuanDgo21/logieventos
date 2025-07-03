import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPage } from './components/providers/providers';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { DashboardComponent } from './components/dashboard/dashboard';
import { SharedModule } from '../shared/shared-module';


@NgModule({
  declarations: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule
  ],
  exports: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent
  ]
})
export class PagesModule { }
