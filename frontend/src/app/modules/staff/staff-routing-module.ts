import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardStaffComponent } from '../../pages/components/dashboard-staff/dashboard-staff';
import { PersonnelTypeListComponent } from './personnel-type-list/personnel-type-list';
import { PersonnelListComponent } from './personnel-list/personnel-list';

const routes: Routes = [
  {path: 'list-staff-type', component: PersonnelTypeListComponent },
  {path: 'list-staff', component: PersonnelListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
