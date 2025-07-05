import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPage } from './components/providers/providers';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { SharedModule } from '../shared/shared-module';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



@NgModule({
  declarations: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    FontAwesomeModule
    // AuthService
  ],
  exports: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage
  ]
})
export class PagesModule { }
