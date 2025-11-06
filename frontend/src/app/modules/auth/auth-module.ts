import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { PasswordRecoveryComponent } from './password-recovery/password-recovery';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; // Línea 9 corregida
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
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()) // Línea 27 corregida - movida a providers
  ]
})
export class AuthModule { }