import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface SocialLink {
  icon: string;
  url: string;
  class: string;
}

interface FooterLink {
  text: string;
  route: string;
}

interface Contact {
  icon: string;
  text: string;
}

interface LegalLink {
  text: string;
  route: string;
}

@Component({
  selector: 'app-footer',
  standalone: false,
  // imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  version = '1.0.0';
}