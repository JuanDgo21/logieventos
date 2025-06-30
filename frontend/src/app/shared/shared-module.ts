import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap'; // Añade esta importación

@NgModule({
  declarations: [
    // Navbar,
    // Footer
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgbCollapseModule
  ],
  // exports: [
  //   Navbar,
  //   Footer
  // ]
})
export class SharedModule { }
