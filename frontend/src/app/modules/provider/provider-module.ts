import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ProviderComponent } from './provider/provider';
import { ProviderRoutingModule } from './provider-routing-module';
import { SharedModule } from '../../shared/shared-module';
import { SidebarStateService } from '../../core/services/sidebar-state';
import { ProviderTypeComponent } from './provider-type/provider-type';

@NgModule({
  declarations: [
    ProviderComponent,
    ProviderTypeComponent
  ],
  imports: [
    CommonModule,
    ProviderRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule,
    FontAwesomeModule,
    SharedModule,
    ToastrModule.forRoot()
  ],
  providers: [SidebarStateService]
})
export class ProviderModule { }
