import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProviderComponent } from './provider/provider';
import { ProviderType } from '../../shared/interfaces/provider-type';
import { ProviderTypeComponent } from './provider-type/provider-type';

const routes: Routes = [
    {path: 'providers', component: ProviderComponent},
    {path: 'provider-type', component: ProviderTypeComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProviderRoutingModule {}
