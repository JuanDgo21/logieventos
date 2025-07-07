import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardStaffComponent } from '../../pages/components/dashboard-staff/dashboard-staff';
import { PersonnelTypeListComponent } from './personnel-type-list/personnel-type-list';
import { PersonnelListComponent } from './personnel-list/personnel-list';

const routes: Routes = [
  {path: 'personnel-types', component: PersonnelTypeListComponent }, //listados 
  {path: 'personnel', component: PersonnelListComponent } //listados
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }
