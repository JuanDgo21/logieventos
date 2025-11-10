import { Component } from '@angular/core';
      
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
  standalone: false, // NOSONAR (typescript:S7648)
  // imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  version = '1.0.0';
}