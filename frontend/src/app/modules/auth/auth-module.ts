import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { PasswordRecoveryComponent } from './password-recovery/password-recovery';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from "../../shared/shared-module";


@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,
    FontAwesomeModule
    // ToastrModule.forRoot({
    //   positionClass: 'toast-top-right',
    //   preventDuplicates: true,
    //   progressBar: true,
    //   closeButton: true
    // })
    ,
    SharedModule
],
  exports: [
    LoginComponent,
    RegisterComponent,
    PasswordRecoveryComponent
  ]
})
export class AuthModule { }