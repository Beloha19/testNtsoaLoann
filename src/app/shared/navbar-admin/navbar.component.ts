// navbar.component.ts
import { Component, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthAdminService } from '../../services/auth-admin.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isScrolled       = false;
  isMobileMenuOpen = false;
  isPanelOpen      = false;
  isModalOpen      = false;
  selectedNotif: Notification | null = null;
  isAdminMenuOpen  = false;

  // Propriété pour vérifier si l'utilisateur est admin
  isAdmin = false;

  // Subscription pour l'état admin
  private adminSubscription: Subscription;

  notifications$: Observable<Notification[]>;
  nonLuesCount$:  Observable<number>;

  constructor(
    private notifService: NotificationService,
    private authAdminService: AuthAdminService,
    private elRef: ElementRef,
    private router: Router
  ) {
    this.notifications$ = this.notifService.notifications$;
    this.nonLuesCount$  = this.notifService.nonLuesCount$;

    // Souscrire aux changements du statut admin
    this.adminSubscription = this.authAdminService.isAdmin$().subscribe(
      isAdmin => {
        this.isAdmin = isAdmin;
        console.log('Statut admin mis à jour:', isAdmin);
      }
    );
  }

  ngOnInit(): void {
    // Initialiser les notifications seulement si l'admin est connecté
    if (this.authAdminService.isLoggedIn()) {
      const adminId = this.authAdminService.getAdminId();
      if (adminId) {
        this.notifService.init(adminId);
      } else {
        this.notifService.init(undefined);
      }
    }
  }

  ngOnDestroy(): void {
    // Nettoyer la subscription
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Ferme le panel des notifications si clic en dehors
    const wrapper = this.elRef.nativeElement.querySelector('.ms-notif-wrapper');
    if (this.isPanelOpen && wrapper && !wrapper.contains(target)) {
      this.isPanelOpen = false;
    }

    // Ferme le menu admin si clic en dehors
    const adminWrapper = this.elRef.nativeElement.querySelector('.admin-menu-wrapper');
    if (this.isAdminMenuOpen && adminWrapper && !adminWrapper.contains(target)) {
      this.isAdminMenuOpen = false;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Fermer les autres menus quand on ouvre le menu mobile
    if (this.isMobileMenuOpen) {
      this.isPanelOpen = false;
      this.isAdminMenuOpen = false;
    }
  }

  closeMobileMenu():  void {
    this.isMobileMenuOpen = false;
  }

  togglePanel(): void {
    this.isPanelOpen = !this.isPanelOpen;
    // Fermer l'autre menu si on ouvre celui-ci
    if (this.isPanelOpen) {
      this.isAdminMenuOpen = false;
    }
  }

  closePanel():  void {
    this.isPanelOpen = false;
  }

  toggleAdminMenu(): void {
    this.isAdminMenuOpen = !this.isAdminMenuOpen;
    // Fermer l'autre menu si on ouvre celui-ci
    if (this.isAdminMenuOpen) {
      this.isPanelOpen = false;
    }
  }

  closeAdminMenu(): void {
    this.isAdminMenuOpen = false;
  }

  ouvrirModal(notif: Notification): void {
    this.selectedNotif = notif;
    this.isModalOpen   = true;
    this.isPanelOpen   = false;
    this.isAdminMenuOpen = false;
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
      paiement: '💳',
      retard: '⚠️',
      alerte: '🚨',
      info: 'ℹ️',
      reservation: '📅',
      visite: '👁️',
      demande: '📝'
    };
    return icons[type] ?? 'ℹ️';
  }

  onCtaClick(): void {
    if (this.authAdminService.isLoggedIn()) {
      this.router.navigate(['/mon-espace']);
    } else {
      this.router.navigate(['/connexion']);
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authAdminService.logout();
    this.isAdminMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.router.navigate(['/']);
  }

  /**
   * Récupère le nom d'affichage de l'admin connecté
   */
  getAdminDisplayName(): string {
    return this.authAdminService.getAdminDisplayName();
  }

  /**
   * Récupère l'email de l'admin connecté
   */
  getAdminEmail(): string | null {
    return this.authAdminService.getAdminEmail();
  }
}
