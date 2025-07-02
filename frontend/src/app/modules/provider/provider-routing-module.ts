import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Holi } from './components/holi/holi';

const routes: Routes = [
  { path: 'nose', component: Holi }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProviderRoutingModule { }
