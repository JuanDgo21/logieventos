import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing-module';
import { ProvidersPage } from './components/providers/providers';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventoryPage } from './components/inventory-page/inventory-page';
import { Dashboard } from './components/dashboard/dashboard';
import { SharedModule } from '../shared/shared-module';


@NgModule({
  declarations: [
    ProvidersPage,
    InventoryPage,
    Dashboard
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    RouterModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    SharedModule
  ],
  exports: [
    ProvidersPage,
    InventoryPage
  ]
})
export class PagesModule { }
