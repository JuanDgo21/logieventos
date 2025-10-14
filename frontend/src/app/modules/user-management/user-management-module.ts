import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserManagementRoutingModule } from './user-management-routing-module';
import { UserListComponent } from './user-list/user-list';
import { UserProfileComponent } from './user-profile/user-profile';
import { SharedModule } from '../../shared/shared-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserFormComponent } from './user-form/user-form';


@NgModule({
  declarations: [
    UserListComponent,
    UserProfileComponent,
    UserFormComponent,
  ],
  imports: [
    CommonModule,
    UserManagementRoutingModule,
    SharedModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgbModule
  ],
  exports: [
    UserListComponent,
    UserProfileComponent,
    UserFormComponent
  ]
})
export class UserManagementModule { }
