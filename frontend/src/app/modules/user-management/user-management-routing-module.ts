import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile';
import { UserListComponent } from './user-list/user-list';

const routes: Routes = [
  { path: '', // Ruta relativa a '/users'
    redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: UserListComponent },
  { path: 'profile', // Usar parámetro para perfil específico
    component: UserProfileComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { }
