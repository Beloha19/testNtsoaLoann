import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  newsletterSent = false;

  onSubscribe(): void {
    if (!this.newsletterEmail) return;
    // Remplacez par votre appel API
    console.log('Newsletter subscription:', this.newsletterEmail);
    this.newsletterSent = true;
    this.newsletterEmail = '';
    setTimeout(() => (this.newsletterSent = false), 4000);
  }
}
