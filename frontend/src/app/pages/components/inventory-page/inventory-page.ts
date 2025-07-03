import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inventory-page',
  standalone: false,
  // imports: [],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.scss'
})
export class InventoryPageComponent {
  constructor(private router: Router) {}

  navigateTo(path: string): void {
    this.router.navigate([`/inventory/${path}`]);
  }
}