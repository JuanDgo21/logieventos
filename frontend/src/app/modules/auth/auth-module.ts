import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './login/login';
import { Register } from './register/register';
import { PasswordRecovery } from './password-recovery/password-recovery';


@NgModule({
  declarations: [
    Login,
    Register,
    PasswordRecovery
  ],
  imports: [
    CommonModule,
    AuthRoutingModule
  ],
  exports: [
    Login,
    Register,
    PasswordRecovery
  ]
})
export class AuthModule { }
