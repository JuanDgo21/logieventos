import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  isOpen = true;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}