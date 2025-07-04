import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing-module';
import { UserList } from './user-list/user-list';
import { UserProfileComponent } from './user-profile/user-profile';
import { RoleManagement } from './role-management/role-management';


@NgModule({
  declarations: [
    UserList,
    UserProfileComponent,
    RoleManagement
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule
  ],
  exports: [
    UserList,
    UserProfileComponent,
    RoleManagement
  ]
})
export class UserManagementModule { }
