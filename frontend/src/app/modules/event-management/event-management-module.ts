import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventManagementRoutingModule } from './event-management-routing-module';
import { Eventcard  } from './components/eventcard/eventcard';
import { SharedModule } from "../../shared/shared-module"; // Asegúrate de que la ruta sea correcta
@NgModule({
  declarations: [
    Eventcard,
  ],
  imports: [
    CommonModule,
    EventManagementRoutingModule,
    SharedModule
],
  exports: [
    Eventcard,
  ],
})
export class EventManagementModule { }
