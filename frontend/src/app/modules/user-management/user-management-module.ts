import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing-module';
import { UserList } from './user-list/user-list';
import { UserProfileComponent } from './user-profile/user-profile';
import { RoleManagement } from './role-management/role-management';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    UserList,
    UserProfileComponent,
    RoleManagement
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
    SharedModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    FontAwesomeModule

  ],
  exports: [
    UserList,
    UserProfileComponent,
    RoleManagement
  ]
})
export class UserManagementModule { }
