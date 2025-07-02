import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';
import { SharedModule } from '../../shared/shared-module';
import { AuthService } from '../../core/services/auth';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent  {

  userRole: string;

  constructor(private authService: AuthService) {
    this.userRole = this.authService.getPrimaryRole() || 'No definido';
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/auth/login'; // Redirección simple sin guard
  }

}