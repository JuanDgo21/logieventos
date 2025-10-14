import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffRoutingModule } from './staff-routing-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared-module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PersonnelTypeListComponent } from './personnel-type-list/personnel-type-list';
import { PersonnelTypeFormComponent } from './personnel-type-form/personnel-type-form';
import { PersonnelListComponent } from './personnel-list/personnel-list';
import { PersonnelFormComponent } from './personnel-form/personnel-form';


@NgModule({
  declarations: [
    PersonnelTypeListComponent,
    PersonnelTypeFormComponent,
    PersonnelListComponent,
    PersonnelFormComponent
  ],
  imports: [
    CommonModule,
    StaffRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    FontAwesomeModule,


  ],
  exports: [
    PersonnelTypeListComponent,
    PersonnelTypeFormComponent,
    PersonnelListComponent,
    PersonnelFormComponent
  ]
})
export class StaffModule { }
