import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './home/home';
import { SharedModule } from '../shared/shared-module';
import { RouterModule } from '@angular/router';



@NgModule({
  // declarations: [
  //   Home
  // ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    Home
  ],

  exports: [
    Home
  ]
})
export class PagesModule { }
