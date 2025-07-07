import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarStateService } from '../../../core/services/sidebar-state';

@Component({
  selector: 'app-sidebar-inventory',
  standalone: false,
  templateUrl: './sidebar-inventory.html',
  styleUrl: './sidebar-inventory.scss'
})
export class SidebarInventoryComponent {
  constructor(
    public sidebarState: SidebarStateService,
    private router: Router
  ) {
    this.sidebarState.isOpen = true;
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }
}