import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

export interface Locataire {
  demandeId: string;
  reponseId: string;
  dateAcceptation: string;
  commentaire: string | null;
  contratDisponible: boolean;
  contratURL: string | null;
  client: {
    _id: string;
    email: string;
    telephone: string;
    typeClient: string;
  };
  local: {
    nom: string;
    emplacement: string;
    surface: number;
    categorie: string;
    etat: string;
  } | null;
  infoLoc: {
    duree: number;
    prixMensuel: number;
    totalContrat: number;
    dateDebut: string;
    dateFin: string;
  } | null;
}

@Component({
  selector: 'app-admin-locataires',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './locataire.component.html',
  styleUrls: ['./locataire.component.scss']
})
export class AdminLocatairesComponent implements OnInit, OnDestroy {

  locataires: Locataire[] = [];
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  private toastTimer: any;
  private destroy$ = new Subject<void>();

  // Recherche
  searchQuery = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadLocataires(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  loadLocataires(): void {
    this.isLoading = true;
    this.http.get<Locataire[]>(`${API_URL}/ResponseDm/locataires`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.locataires = data;
          this.isLoading = false;
        },
        error: () => {
          this.showToast('Erreur lors du chargement des locataires');
          this.isLoading = false;
        }
      });
  }

  get locatairesFiltres(): Locataire[] {
    if (!this.searchQuery.trim()) return this.locataires;
    const q = this.searchQuery.toLowerCase();
    return this.locataires.filter(l =>
      l.client.email.toLowerCase().includes(q) ||
      l.local?.nom?.toLowerCase().includes(q) ||
      l.local?.emplacement?.toLowerCase().includes(q)
    );
  }

  // Ouvre le contrat PDF dans un nouvel onglet
  // Étape 1 : POST pour obtenir un tempToken valable 60s
  // Étape 2 : window.open avec ce tempToken en query param
  ouvrirContrat(locataire: Locataire): void {
    if (!locataire.demandeId) {
      this.showToast('Contrat non disponible');
      return;
    }

    this.http.post<{ tempToken: string }>(
      `${API_URL}/ResponseDm/contrat-token/${locataire.demandeId}`, {}
    ).subscribe({
      next: ({ tempToken }) => {
        const url = `${API_URL}/ResponseDm/contrat-apercu/${locataire.demandeId}?token=${tempToken}`;
        window.open(url, '_blank');
      },
      error: () => this.showToast('Impossible d\'ouvrir le contrat')
    });
  }

  formatPrix(montant: number): string {
    if (!montant) return '—';
    return montant.toLocaleString('fr-FR') + ' Ar';
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 4000);
  }
}
