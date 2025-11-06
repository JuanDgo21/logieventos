import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing-module';
import { ResourcesComponent } from './resources/resources';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // Línea 7 corregida
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ResourceTypesComponent } from './resource-types/resource-types';
import { SidebarStateService } from '../../core/services/sidebar-state';
import { SharedModule } from '../../shared/shared-module';



@NgModule({
  providers: [
    SidebarStateService,
    provideHttpClient(withInterceptorsFromDi()) // Línea 27 corregida - agregado a providers
  ], 
  declarations: [
    ResourcesComponent,
    ResourceTypesComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule
  ],
    exports: [
      //ResourcesComponent QUITAR ESTO PARA USAR LAS PAGINAS EN OTROS MODULOS
    ]
})
export class InventoryModule { }