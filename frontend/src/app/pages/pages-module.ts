import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPageComponent } from './components/providers/providers';
import { RouterModule } from '@angular/router';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventPageComponent } from './components/event-page/event-page';
import { EventTypeComponent } from './components/event-type/event-type';


@NgModule({
  declarations: [
    ProvidersPageComponent,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent,
    DashboardStaffComponent,
    EventPageComponent,
    EventTypeComponent
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    SharedModule,
    FontAwesomeModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbProgressbarModule,
    StaffModule,
    UserManagementModule,
    // UserManagementModule,
    // BrowserAnimationsModule
    // NgModule
    // AuthService
  ],
  exports: [
    ProvidersPageComponent,
    InventoryPageComponent,
    DashboardComponent,
    ContractsPage,
    DashboardUsersComponent,
    DashboardStaffComponent,
    EventPageComponent
  ]
})
export class PagesModule { }
