import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPage } from './components/providers/providers';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryPageComponent } from './components/inventory-page/inventory-page';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ContractsPage } from './components/contracts-page/contracts-page';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DashboardUsersComponent } from './components/dashboard-users/dashboard-users';
import { SharedModule } from '../shared/shared-module';
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardStaffComponent } from './components/dashboard-staff/dashboard-staff';
import { StaffModule } from '../modules/staff/staff-module';
import { UserManagementModule } from '../modules/user-management/user-management-module';


@NgModule({
  declarations: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent,
    DashboardStaffComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    SharedModule,
    FontAwesomeModule,
    RouterModule,
    FormsModule,
    NgbProgressbarModule,
    StaffModule,
    UserManagementModule
    // UserManagementModule,
    // BrowserAnimationsModule
    // NgModule
    // AuthService
  ],
  exports: [
    ProvidersPage,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent,
    DashboardStaffComponent
  ]
})
export class PagesModule { }
