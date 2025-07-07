import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPage } from './components/providers/providers';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { SharedModule } from '../shared/shared-module';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DashboardUsersComponent } from './components/dashboard-users/dashboard-users';



@NgModule({
  declarations: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    FontAwesomeModule,
    MatSnackBarModule
    // NgModule
    // AuthService
  ],
  exports: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent
  ]
})
export class PagesModule { }
