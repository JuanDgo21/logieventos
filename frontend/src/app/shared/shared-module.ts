import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './components/footer/footer';
import { NavbarComponent } from './components/navbar/navbar';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal';
import { SidebarInventoryComponent } from './components/sidebar-inventory/sidebar-inventory';


@NgModule({
  declarations: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    ConfirmModalComponent,
    SidebarInventoryComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    ConfirmModalComponent,
    SidebarInventoryComponent
  ]
})
export class SharedModule { }
