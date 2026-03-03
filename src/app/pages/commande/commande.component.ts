import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

export interface LigneCommande {
  produitID: string;
  nomProduit: string;
  prixUnitaire: any;
  quantite: any;
  sousTotal: any;
}

export interface CommandeResume {
  _id: string;
  numero: string;
  montantTotal: any;
  statut: 'en attente paiement' | 'payee' | 'annulee';
  nombreArticles: number;
  date: string;
  paiement: { statut: string; statutPreuve: string; modePaiement: string; } | null;
}

export interface CommandeDetail {
  commande: {
    _id: string; numero: string; montantTotal: any;
    statut: string; lignes: LigneCommande[]; note?: string; createdAt: string;
  };
  paiement: {
    _id: string; statut: string; montantDu: any; montantPaye?: any;
    modePaiement?: string; statutPreuve: string;
    referenceTransaction?: string; note?: string; datePaiement?: string;
  } | null;
}

@Component({
  selector: 'app-mes-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './commande.component.html',
  styleUrls: ['./commande.component.scss']
})
export class MesCommandesComponent implements OnInit, OnDestroy {

  commandes: CommandeResume[] = [];
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  filtreStatut = 'tous';

  isDetailOpen = false;
  isDetailLoading = false;
  detail: CommandeDetail | null = null;

  isPreuveOpen = false;
  commandePreuve: CommandeResume | null = null;
  preuveFile: File | null = null;
  preuveModePaiement: 'mobile_money' | 'cheque' = 'mobile_money';
  preuveReference = '';
  isPreuveSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadCommandes(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); clearTimeout(this.toastTimer); }

  loadCommandes(): void {
    this.isLoading = true;
    this.http.get<{ total: number; commandes: CommandeResume[] }>(`${API_URL}/commandes/mes-commandes`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.commandes = data.commandes; this.isLoading = false; },
        error: () => { this.showToast('Erreur chargement commandes', 'error'); this.isLoading = false; }
      });
  }

  get commandesFiltrees(): CommandeResume[] {
    if (this.filtreStatut === 'tous') return this.commandes;
    return this.commandes.filter(c => c.statut === this.filtreStatut);
  }

  ouvrirDetail(commande: CommandeResume): void {
    this.isDetailOpen = true;
    this.isDetailLoading = true;
    this.detail = null;
    this.http.get<CommandeDetail>(`${API_URL}/commandes/${commande._id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.detail = data; this.isDetailLoading = false; },
        error: () => { this.isDetailLoading = false; this.showToast('Erreur chargement détail', 'error'); }
      });
  }

  fermerDetail(): void { this.isDetailOpen = false; this.detail = null; }

  ouvrirPreuve(commande: CommandeResume, fromDetail = false): void {
    if (fromDetail) this.fermerDetail();
    this.commandePreuve = commande;
    this.preuveFile = null;
    this.preuveModePaiement = 'mobile_money';
    this.preuveReference = '';
    setTimeout(() => this.isPreuveOpen = true, fromDetail ? 180 : 0);
  }

  fermerPreuve(): void { this.isPreuveOpen = false; this.commandePreuve = null; }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.preuveFile = input.files[0];
  }

  soumettrePreuve(): void {
    if (!this.commandePreuve || !this.preuveFile) return;
    this.isPreuveSubmitting = true;
    const fd = new FormData();
    fd.append('preuve', this.preuveFile);
    fd.append('modePaiement', this.preuveModePaiement);
    if (this.preuveReference) fd.append('referenceTransaction', this.preuveReference);

    this.http.post(`${API_URL}/commandes/paiement/soumettre-preuve/${this.commandePreuve._id}`, fd)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isPreuveSubmitting = false;
          this.fermerPreuve();
          this.showToast('Preuve soumise — en attente de validation', 'success');
          this.loadCommandes();
        },
        error: (err) => {
          this.isPreuveSubmitting = false;
          this.showToast(err?.error?.message ?? 'Erreur soumission', 'error');
        }
      });
  }

  // Helpers
  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg; this.toastType = type; this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 3500);
  }

  formatPrix(prix: any): string {
    const n = typeof prix === 'object' && prix?.$numberDecimal ? parseFloat(prix.$numberDecimal) : Number(prix);
    return new Intl.NumberFormat('fr-FR').format(n) + ' Ar';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDateHeure(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  getStatutConfig(s: string) {
    const map: Record<string, any> = {
      'en attente paiement': { label: 'En attente', color: '#c4a05a', bg: 'rgba(196,160,90,.08)', border: 'rgba(196,160,90,.28)', icon: '⏳' },
      'payee':   { label: 'Payée',   color: '#2a9d8f', bg: 'rgba(42,157,143,.08)', border: 'rgba(42,157,143,.3)',  icon: '✓' },
      'annulee': { label: 'Annulée', color: '#7a7870', bg: 'rgba(122,120,112,.08)',border: 'rgba(122,120,112,.3)', icon: '✕' },
    };
    return map[s] ?? { label: s, color: '#7a7870', bg: 'rgba(122,120,112,.08)', border: 'rgba(122,120,112,.3)', icon: '—' };
  }

  getPaiementLabel(statut: string): { label: string; color: string } {
    const map: Record<string, any> = {
      'en attente':           { label: 'Paiement en attente', color: '#c4a05a' },
      'paye':                 { label: 'Paiement confirmé',   color: '#2a9d8f' },
      'en_attente_validation':{ label: 'Preuve soumise',      color: '#9b59b6' },
      'rejetee':              { label: 'Preuve rejetée',      color: '#e74c3c' },
    };
    return map[statut] ?? { label: statut, color: '#7a7870' };
  }

  peutSoumettrePreuve(c: CommandeResume): boolean {
    if (c.statut === 'payee' || c.statut === 'annulee') return false;
    const sp = c.paiement?.statutPreuve;
    return !sp || sp === 'rejetee';
  }

  countByStatut(s: string): number {
    if (s === 'tous') return this.commandes.length;
    return this.commandes.filter(c => c.statut === s).length;
  }

  detailAsResume(): CommandeResume | null {
    if (!this.detail) return null;
    return {
      _id: this.detail.commande._id,
      numero: this.detail.commande.numero,
      montantTotal: this.detail.commande.montantTotal,
      statut: this.detail.commande.statut as any,
      nombreArticles: this.detail.commande.lignes.length,
      date: this.detail.commande.createdAt,
      paiement: this.detail.paiement ? {
        statut: this.detail.paiement.statut,
        statutPreuve: this.detail.paiement.statutPreuve,
        modePaiement: this.detail.paiement.modePaiement ?? ''
      } : null
    };
  }
}
