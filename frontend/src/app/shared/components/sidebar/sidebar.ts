import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { LayoutService } from '../../../core/services/layout';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
}) 
export class SidebarComponent implements OnInit {
  modules: any[] = [];
  collapsed = false;

  constructor(
    public layoutService: LayoutService,
    private authService: AuthService,
    private router: Router
  ) {
    this.layoutService.sidebarCollapsed$.subscribe(collapsed => {
      this.collapsed = collapsed;
    });
  }

  ngOnInit(): void {
    const decodedToken = this.authService.decodeToken();
    const role = decodedToken?.role;
    
    if (role) {
      this.modules = this.layoutService.getModulesForRole(role);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  setActiveModule(module: string): void {
    this.layoutService.setActiveModule(module);
  }
}