import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginComponent } from './login/login';
import { Register } from './register/register';
import { PasswordRecovery } from './password-recovery/password-recovery';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ToastrModule } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    LoginComponent,
    Register,
    PasswordRecovery
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FontAwesomeModule
        // ToastrModule.forRoot({
    //   positionClass: 'toast-top-right',
    //   preventDuplicates: true,
    //   progressBar: true,
    //   closeButton: true
    // })
  ],
  exports: [
    LoginComponent,
    Register,
    PasswordRecovery
  ]
})
export class AuthModule { }