import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

export interface Loyer {
  _id: string;
  moisConcerne: string;
  moisLabel: string;
  dateEcheance: string;
  montantDu: number;
  montantPaye: number;
  resteAPayer: number;
  datePaiement: string | null;
  statut: 'en attente' | 'paye' | 'en retard' | 'impaye';
  modePaiement: string | null;
  referenceTransaction: string | null;
  statutPreuve: 'non_requise' | 'en_attente_validation' | 'validee' | 'rejetee' | null;
  estEnRetard: boolean;
  joursRetard: number;
  note: string | null;
}

export interface Resume {
  moisEnCours: string;
  loyerMensuel: number;
  totalDu: number;
  totalPaye: number;
  totalRestant: number;
  nombreEnRetard: number;
  duree: number;
  moisRestants: number;
}

@Component({
  selector: 'app-client-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './client-paiements.component.html',
  styleUrls: ['./client-paiements.component.scss']
})
export class ClientPaiementsComponent implements OnInit, OnDestroy {

  loyers: Loyer[] = [];
  resume: Resume | null = null;
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:5000';

  // Filtre
  filtreStatut: string = 'tous';

  // Modal paiement
  isModalOpen = false;
  loyerSelectionne: Loyer | null = null;
  modePaiement: 'mvola' | 'orange_money' = 'mvola';
  referenceTransaction = '';
  fichierPreuve: File | null = null;
  isSubmitting = false;
  dragOver = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLoyers();
    this.ecouterMisesAJour();
  }

  // ── TEMPS RÉEL — Socket.io ────────────────────────────────
  // Écoute les mises à jour de l'admin (validation/rejet de preuve)
  ecouterMisesAJour(): void {
    const socket = (window as any).__socket;
    if (!socket) return; // socket non disponible

    socket.on('paiement_mis_a_jour', (data: any) => {
      const idx = this.loyers.findIndex(l => l._id === data.paiementId);
      if (idx !== -1) {
        // Mise à jour partielle du loyer concerné
        this.loyers[idx] = { ...this.loyers[idx], ...data };
        this.loyers = [...this.loyers]; // déclencher détection de changement
        if (data.message) this.showToast(data.message, 'success');
      } else {
        // Nouveau mois créé → recharger
        this.loadLoyers();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ── CHARGEMENT ────────────────────────────────────────────
  loadLoyers(): void {
    this.isLoading = true;
    this.http.get<{ resume: Resume; loyers: Loyer[] }>(`${this.apiUrl}/PaimentCm/mes-loyers`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ resume, loyers }) => {
          this.resume = resume;
          this.loyers = loyers ?? [];
          this.isLoading = false;
        },
        error: () => {
          this.showToast('Erreur lors du chargement des loyers', 'error');
          this.isLoading = false;
        }
      });
  }

  // ── FILTRE ────────────────────────────────────────────────
  get loyersFiltres(): Loyer[] {
    if (this.filtreStatut === 'tous') return this.loyers;
    return this.loyers.filter(l => l.statut === this.filtreStatut);
  }

  setFiltre(statut: string): void { this.filtreStatut = statut; }

  // ── MODAL PAIEMENT ────────────────────────────────────────
  ouvrirModal(loyer: Loyer): void {
    this.loyerSelectionne = loyer;
    this.modePaiement = 'mvola';
    this.referenceTransaction = '';
    this.fichierPreuve = null;
    this.isModalOpen = true;
  }

  fermerModal(): void {
    this.isModalOpen = false;
    this.loyerSelectionne = null;
    this.fichierPreuve = null;
  }

  // ── FICHIER PREUVE ────────────────────────────────────────
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.fichierPreuve = input.files[0];
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver = true; }
  onDragLeave(): void { this.dragOver = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.fichierPreuve = file;
  }

  supprimerFichier(e: Event): void {
    e.stopPropagation();
    this.fichierPreuve = null;
  }

  triggerFileInput(): void {
    document.getElementById('preuve-input')?.click();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  // ── SOUMISSION PREUVE ─────────────────────────────────────
  soumettrePreuve(): void {
    if (!this.loyerSelectionne || !this.fichierPreuve) return;

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('preuve', this.fichierPreuve);
    formData.append('modePaiement', this.modePaiement);
    if (this.referenceTransaction) {
      formData.append('referenceTransaction', this.referenceTransaction);
    }

    this.http.post<any>(
      `${this.apiUrl}/PaimentCm/soumettre-preuve/${this.loyerSelectionne._id}`,
      formData
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.fermerModal();
          this.showToast('Preuve soumise avec succès ✓', 'success');
          this.loadLoyers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err?.error?.message ?? 'Erreur lors de la soumission', 'error');
        }
      });
  }

  // ── HELPERS ───────────────────────────────────────────────
  peutPayer(loyer: Loyer): boolean {
    return loyer.statut !== 'paye'
      && loyer.statutPreuve !== 'en_attente_validation';
  }

  getStatutConfig(statut: string, statutPreuve?: string | null) {
    if (statutPreuve === 'en_attente_validation') {
      return { label: 'Preuve en attente', color: '#c4a05a', bg: 'rgba(196,160,90,0.1)', border: 'rgba(196,160,90,0.3)', icon: '⏳' };
    }
    if (statutPreuve === 'rejetee') {
      return { label: 'Preuve rejetée', color: '#e74c3c', bg: 'rgba(231,76,60,0.1)', border: 'rgba(231,76,60,0.3)', icon: '❌' };
    }
    const configs: Record<string, any> = {
      'paye':       { label: 'Payé',       color: '#2a9d8f', bg: 'rgba(42,157,143,0.1)', border: 'rgba(42,157,143,0.3)', icon: '✓' },
      'en attente': { label: 'En attente', color: '#b0aca4', bg: 'rgba(176,172,164,0.08)', border: 'rgba(176,172,164,0.2)', icon: '○' },
      'en retard':  { label: 'En retard',  color: '#e74c3c', bg: 'rgba(231,76,60,0.1)', border: 'rgba(231,76,60,0.3)', icon: '!' },
      'impaye':     { label: 'Impayé',     color: '#c0392b', bg: 'rgba(192,57,43,0.1)', border: 'rgba(192,57,43,0.3)', icon: '✕' },
    };
    return configs[statut] ?? configs['en attente'];
  }

  formatPrix(montant: number): string {
    if (!montant && montant !== 0) return '—';
    return montant.toLocaleString('fr-FR') + ' Ar';
  }

  getProgressionPct(): number {
    if (!this.resume) return 0;
    const total = this.resume.totalDu;
    if (!total) return 0;
    return Math.round((this.resume.totalPaye / total) * 100);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 4500);
  }
}
