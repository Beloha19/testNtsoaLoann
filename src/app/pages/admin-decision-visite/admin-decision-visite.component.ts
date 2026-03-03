import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

export interface Visite {
  _id: string;
  localeID: { _id: string; nom_boutique: string } | null;
  clientId: { _id: string; nom?: string; prenom?: string; email?: string } | null;
  date: string;
  heure_debut: string;
  heure_fin: string;
  statut: string;
  createdAt: string;
}

export interface LocalOption {
  id: string;
  nom: string;
}

@Component({
  selector: 'app-admin-visites',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NavbarComponent, FooterComponent],
  templateUrl: './admin-decision-visite.component.html',
  styleUrls: ['./admin-decision-visite.component.scss']
})
export class AdminVisitesComponent implements OnInit, OnDestroy {

  allVisites: Visite[] = [];
  visites: Visite[] = [];
  showEnAttenteOnly = true;
  showTodayOnly = false;
  selectedLocalId = '';
  locaux: LocalOption[] = [];
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  private toastTimer: any;

  // ── Map décisions réservation locale : visiteId → 'reserve' | 'ne_convient_pas'
  // Stocke en mémoire la décision prise sur le local après validation de visite
  resaDecisions = new Map<string, 'reserve' | 'ne_convient_pas'>();

  // ── MODAL DETAIL ────────────────────────────────────
  isDetailModalOpen = false;
  visiteDetail: Visite | null = null;

  // ── MODAL REPORTER ──────────────────────────────────
  isReporterModalOpen = false;
  visiteEnCours: Visite | null = null;
  reportForm = { nouvelleDate: '', nouvelleHeureDebut: '', nouvelleHeureFin: '', motif: '' };
  isSubmitting = false;

  // ── MODAL MOTIF (refus) ──────────────────────────────
  isMotifModalOpen = false;
  motifRefus = '';
  visiteARefuser: Visite | null = null;

  // ── MODAL RÉSERVATION ────────────────────────────────
  isReservationModalOpen = false;
  visiteAReserver: Visite | null = null;
  reservationForm = { duree: null as number | null, prix: null as number | null, status: 'En attente' };

  readonly CRENEAUX = ['09','10','11','14','15','16','17','18'];

  readonly STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    'en attente de confirmation': { label: 'En attente', color: '#c4a05a', bg: 'rgba(196,160,90,0.08)', border: 'rgba(196,160,90,0.3)', icon: '⏳' },
    'Validée':  { label: 'Validée',  color: '#2a9d8f', bg: 'rgba(42,157,143,0.08)',  border: 'rgba(42,157,143,0.3)',  icon: '✅' },
    'Refusée':  { label: 'Refusée',  color: '#e74c3c', bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.3)',   icon: '❌' },
    'Reportée': { label: 'Reportée', color: '#9b59b6', bg: 'rgba(155,89,182,0.08)',  border: 'rgba(155,89,182,0.3)',  icon: '📅' },
    'Annulée':  { label: 'Annulée',  color: '#7a7870', bg: 'rgba(122,120,112,0.08)', border: 'rgba(122,120,112,0.3)', icon: '🚫' },
  };

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadVisites(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ── DÉCISION RÉSERVATION LOCALE ─────────────────────
  /** Retourne la décision de réservation locale pour une visite, ou null */
  getResaDecision(visiteId: string): 'reserve' | 'ne_convient_pas' | null {
    return this.resaDecisions.get(visiteId) ?? null;
  }

  /** Marque "ne convient pas" — bloque les boutons */
  marquerNeConvientPas(visiteId: string): void {
    this.resaDecisions.set(visiteId, 'ne_convient_pas');
  }

  /** Marque "ne convient pas" depuis le modal détail et ferme */
  marquerNeConvientPasEtFermer(visiteId: string): void {
    this.marquerNeConvientPas(visiteId);
    this.fermerDetail();
  }

  // ── DETAIL MODAL ────────────────────────────────────
  ouvrirDetail(visite: Visite): void {
    this.visiteDetail = visite;
    this.isDetailModalOpen = true;
  }

  fermerDetail(): void {
    this.isDetailModalOpen = false;
    this.visiteDetail = null;
  }

  ouvrirReporterDepuisDetail(visite: Visite): void {
    this.fermerDetail();
    setTimeout(() => this.ouvrirReporter(visite), 200);
  }

  ouvrirRefusDepuisDetail(visite: Visite): void {
    this.fermerDetail();
    setTimeout(() => this.ouvrirMotifRefus(visite), 200);
  }

  validerDepuisDetail(visite: Visite): void {
    this.fermerDetail();
    setTimeout(() => this.validerVisite(visite), 200);
  }

  ouvrirReservationDepuisDetail(visite: Visite): void {
    this.fermerDetail();
    setTimeout(() => this.ouvrirReservation(visite), 200);
  }

  // ── TOGGLE FILTRES ──────────────────────────────────
  toggleFilter(): void {
    this.showEnAttenteOnly = !this.showEnAttenteOnly;
    this.applyFilter();
  }

  toggleTodayFilter(): void {
    this.showTodayOnly = !this.showTodayOnly;
    this.applyFilter();
  }

  selectLocal(id: string): void {
    this.selectedLocalId = id;
    this.applyFilter();
  }

  private applyFilter(): void {
    let result = [...this.allVisites];

    if (this.showEnAttenteOnly) {
      result = result.filter(v => v.statut === 'en attente de confirmation');
    }

    // Filtre aujourd'hui — comparaison en heure locale
    if (this.showTodayOnly) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      result = result.filter(v => {
        const visitDate = new Date(v.date);
        const visitStr = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}-${String(visitDate.getDate()).padStart(2, '0')}`;
        return visitStr === todayStr;
      });
    }

    if (this.selectedLocalId) {
      result = result.filter(v => v.localeID?._id === this.selectedLocalId);
    }

    this.visites = result;
  }

  private buildLocaux(): void {
    const map = new Map<string, string>();
    for (const v of this.allVisites) {
      if (v.localeID && !map.has(v.localeID._id)) {
        map.set(v.localeID._id, v.localeID.nom_boutique);
      }
    }
    this.locaux = Array.from(map.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }

  get countEnAttente(): number {
    return this.allVisites.filter(v => v.statut === 'en attente de confirmation').length;
  }

  get selectedLocalNom(): string {
    return this.locaux.find(l => l.id === this.selectedLocalId)?.nom ?? '';
  }

  loadVisites(): void {
    this.isLoading = true;
    this.http.get<Visite[]>(`${API_URL}/VisiteCM/all-visite`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allVisites = data;
          this.buildLocaux();
          this.applyFilter();
          this.isLoading = false;
        },
        error: () => {
          this.showToast('Erreur lors du chargement des visites');
          this.isLoading = false;
        }
      });
  }

  validerVisite(visite: Visite): void {
    this.sendDecision(visite._id, { statut: 'Validée' }, 'Visite validée avec succès');
  }

  ouvrirMotifRefus(visite: Visite): void {
    this.visiteARefuser = visite;
    this.motifRefus = '';
    this.isMotifModalOpen = true;
  }

  confirmerRefus(): void {
    if (!this.visiteARefuser) return;
    this.sendDecision(this.visiteARefuser._id, { statut: 'Refusée', motif: this.motifRefus }, 'Visite refusée');
    this.isMotifModalOpen = false;
    this.visiteARefuser = null;
  }

  ouvrirReporter(visite: Visite): void {
    this.visiteEnCours = visite;
    this.reportForm = { nouvelleDate: '', nouvelleHeureDebut: '', nouvelleHeureFin: '', motif: '' };
    this.isReporterModalOpen = true;
  }

  confirmerReport(): void {
    if (!this.visiteEnCours) return;
    if (!this.reportForm.nouvelleDate || !this.reportForm.nouvelleHeureDebut || !this.reportForm.nouvelleHeureFin) {
      this.showToast('Veuillez remplir tous les champs de report');
      return;
    }
    this.isSubmitting = true;
    this.sendDecision(this.visiteEnCours._id, {
      statut: 'Reportée',
      nouvelleDate: this.reportForm.nouvelleDate,
      nouvelleHeureDebut: this.reportForm.nouvelleHeureDebut,
      nouvelleHeureFin: this.reportForm.nouvelleHeureFin,
      motif: this.reportForm.motif
    }, 'Visite reportée avec succès');
  }

  // ── RÉSERVATION ─────────────────────────────────────
  ouvrirReservation(visite: Visite): void {
    this.visiteAReserver = visite;
    this.reservationForm = { duree: null, prix: null, status: 'En attente' };
    this.isReservationModalOpen = true;
  }

  closeReservationModal(): void {
    this.isReservationModalOpen = false;
    this.visiteAReserver = null;
  }

  confirmerReservation(): void {
    if (!this.visiteAReserver) return;

    if (!this.reservationForm.duree || !this.reservationForm.prix) {
      this.showToast('Veuillez renseigner la durée et le prix');
      return;
    }

    if (!this.visiteAReserver.localeID?._id) {
      this.showToast('Local introuvable pour cette visite');
      return;
    }

    this.isSubmitting = true;
    const visiteId = this.visiteAReserver._id;

    const body = {
      localeID: this.visiteAReserver.localeID._id,
      clientId: this.visiteAReserver.clientId?._id ?? null,
      infoLoc: {
        dure: this.reservationForm.duree,
        prix: this.reservationForm.prix
      },
      status: this.reservationForm.status
    };

    this.http.post(`${API_URL}/ReservationCM/add-reservation`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isReservationModalOpen = false;
          // Marquer la décision comme "réservé" → bloque les boutons
          this.resaDecisions.set(visiteId, 'reserve');
          this.visiteAReserver = null;
          this.showToast('Réservation créée avec succès 🏠');
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err?.error?.message ?? 'Erreur lors de la réservation');
        }
      });
  }

  private sendDecision(id: string, body: any, successMsg: string): void {
    this.http.patch(`${API_URL}/VisiteCM/${id}/decision`, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const idx = this.allVisites.findIndex(v => v._id === id);
          if (idx !== -1) {
            this.allVisites[idx] = { ...this.allVisites[idx], statut: body.statut };
          }
          this.applyFilter();
          this.isReporterModalOpen = false;
          this.isMotifModalOpen = false;
          this.isSubmitting = false;
          this.visiteEnCours = null;
          this.showToast(successMsg);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err?.error?.message ?? 'Une erreur est survenue');
        }
      });
  }

  isEnAttente(visite: Visite): boolean {
    return visite.statut === 'en attente de confirmation';
  }

  getStatutConfig(status: string) {
    return this.STATUT_CONFIG[status] ?? {
      label: status, color: '#7a7870', icon: '—',
      bg: 'rgba(122,120,112,0.08)', border: 'rgba(122,120,112,0.3)'
    };
  }

  closeReporterModal(): void { this.isReporterModalOpen = false; this.visiteEnCours = null; }
  closeMotifModal(): void { this.isMotifModalOpen = false; this.visiteARefuser = null; }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 3500);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  getClientNom(visite: Visite): string {
    if (!visite.clientId) return 'Client inconnu';
    const c = visite.clientId;
    return [c.prenom, c.nom].filter(Boolean).join(' ') || c.email || 'Client';
  }

  getLocalNom(visite: Visite): string {
    return visite.localeID?.nom_boutique ?? 'Local inconnu';
  }

  getCreneau(visite: Visite): string {
    return `${String(visite.heure_debut).padStart(2,'0')}h00 — ${String(visite.heure_fin).padStart(2,'0')}h00`;
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
