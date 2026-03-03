import { Component, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth/auth.service';
import { Observable, Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-navbar-user',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar-client.component.html',
  styleUrls: ['./navbar-client.component.scss']
})
export class NavbarUserComponent implements OnInit, OnDestroy {
  isScrolled       = false;
  isMobileMenuOpen = false;
  isPanelOpen      = false;
  isModalOpen      = false;
  isUserMenuOpen   = false;
  selectedNotif: Notification | null = null;

  isAuthenticated = false;
  userName  = 'Utilisateur';
  userEmail = 'user@example.com';

  notifications$: Observable<Notification[]>;
  nonLuesCount$:  Observable<number>;

  private routerSub: Subscription | null = null;

  constructor(
    private notifService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private elRef: ElementRef
  ) {
    this.notifications$ = this.notifService.notifications$;
    this.nonLuesCount$  = this.notifService.nonLuesCount$;
  }

  ngOnInit(): void {
    this.checkAuthentication();

    const userId = this.authService.getUserId();
    this.notifService.init(userId ?? undefined);

    // Re-vérifier l'auth à chaque changement de route
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.checkAuthentication());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private checkAuthentication(): void {
    console.log('token =', localStorage.getItem('token'));
    console.log('user =', localStorage.getItem('user'));

    this.isAuthenticated = this.authService.isLoggedIn();
    console.log('isAuthenticated =', this.isAuthenticated);

    if (this.isAuthenticated) {
      const user = this.authService.getUser();
      console.log('user obj =', user);
      this.userName  = user?.nom ? `${user.nom} ${user.prenom || ''}`.trim() : 'Utilisateur';
      this.userEmail = user?.email || 'user@example.com';
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    const wrapper = this.elRef.nativeElement.querySelector('.ms-notif-wrapper');
    if (this.isPanelOpen && wrapper && !wrapper.contains(target)) {
      this.isPanelOpen = false;
    }

    const userWrapper = this.elRef.nativeElement.querySelector('.user-menu-wrapper');
    if (this.isUserMenuOpen && userWrapper && !userWrapper.contains(target)) {
      this.isUserMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.isPanelOpen    = false;
      this.isUserMenuOpen = false;
    }
  }

  closeMobileMenu(): void { this.isMobileMenuOpen = false; }

  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    if (this.isPanelOpen) this.isUserMenuOpen = false;
  }

  closePanel(): void { this.isPanelOpen = false; }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) this.isPanelOpen = false;
  }

  closeUserMenu(): void { this.isUserMenuOpen = false; }

  ouvrirModal(notif: Notification): void {
    this.selectedNotif  = notif;
    this.isModalOpen    = true;
    this.isPanelOpen    = false;
    this.isUserMenuOpen = false;
  }

  fermerModal(): void {
    this.isModalOpen   = false;
    this.selectedNotif = null;
  }

  toggleLu(notif: Notification, event: Event): void {
    event.stopPropagation();
    this.notifService.toggleLu(notif._id);
  }

  marquerToutesLues(): void {
    this.notifService.marquerToutesLues();
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      paiement:    '💳',
      retard:      '⚠️',
      alerte:      '🚨',
      info:        'ℹ️',
      reservation: '📅',
      contrat:     '📄',
      visite:      '👁️'
    };
    return icons[type] ?? 'ℹ️';
  }

  onCtaClick(): void {
    this.router.navigate([this.isAuthenticated ? '/mon-espace' : '/login']);
  }

  getUserName():  string { return this.userName; }
  getUserEmail(): string { return this.userEmail; }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated = false;
    this.isUserMenuOpen  = false;
    this.userName        = 'Utilisateur';
    this.userEmail       = 'user@example.com';
    this.router.navigate(['/']);
  }
}
