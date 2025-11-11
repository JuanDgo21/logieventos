import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarStateService } from '../../../core/services/sidebar-state';

@Component({
  selector: 'app-sidebar-inventory',
  standalone: false, // NOSONAR (typescript:S7648)
  templateUrl: './sidebar-inventory.html',
  styleUrl: './sidebar-inventory.scss'
})
export class SidebarInventoryComponent {
  constructor(
    public sidebarState: SidebarStateService,
    private readonly router: Router
  ) {
    this.sidebarState.isOpen = true;
  }

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }
}