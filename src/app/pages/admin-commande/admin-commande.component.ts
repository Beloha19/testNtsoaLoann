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
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export interface Commande {
  _id: string;
  numero: string;
  clientID: { _id: string; email: string; telephone?: string } | null;
  lignes: LigneCommande[];
  montantTotal: number;
  statut: 'en attente paiement' | 'payee' | 'annulee';
  note?: string;
  createdAt: string;
  paiement?: PaiementInfo;
}

export interface PaiementInfo {
  _id: string;
  statut: 'en attente' | 'paye';
  statutPreuve?: 'aucune' | 'en_attente_validation' | 'validee' | 'rejetee' | 'non_requise';
  modePaiement?: string;
  montantDu: number;
  referenceTransaction?: string;
  preuveUrl?: string;
  soumisLe?: string;
  client?: { email: string; telephone?: string };
  commande?: { _id: string; numero: string; montantTotal: number; lignes: LigneCommande[] };
}

type ActiveSection = 'toutes' | 'preuves' | 'impayes';

@Component({
  selector: 'app-admin-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './admin-commande.component.html',
  styleUrls: ['./admin-commande.component.scss']
})
export class AdminCommandesComponent implements OnInit, OnDestroy {

  activeSection: ActiveSection = 'toutes';

  // ── TOUTES LES COMMANDES
  allCommandes: Commande[] = [];
  filteredCommandes: Commande[] = [];
  statutFilter = '';
  isLoadingCommandes = false;

  // ── PREUVES EN ATTENTE
  preuves: PaiementInfo[] = [];
  isLoadingPreuves = false;
  preuveSelectionnee: PaiementInfo | null = null;
  isPreuveModalOpen = false;
  decisionNote = '';
  isSubmittingDecision = false;

  // ── COMMANDES IMPAYÉES
  impayes: PaiementInfo[] = [];
  isLoadingImpayes = false;

  // ── MODAL PAIEMENT DIRECT
  isPaiementDirectModalOpen = false;
  paiementDirectCible: PaiementInfo | null = null;
  paiementDirectForm = { modePaiement: 'especes', referenceTransaction: '', note: '' };
  isSubmittingPaiementDirect = false;

  // ── MODAL DÉTAIL COMMANDE
  isDetailCommandeOpen = false;
  commandeDetail: Commande | null = null;

  // ── TOAST
  toastMessage = '';
  isToastVisible = false;
  private toastTimer: any;

  private destroy$ = new Subject<void>();

  readonly STATUT_COMMANDE: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    'en attente paiement': { label: 'En attente', color: '#c4a05a', bg: 'rgba(196,160,90,0.08)', border: 'rgba(196,160,90,0.3)', icon: '⏳' },
    'payee':   { label: 'Payée',    color: '#27ae60', bg: 'rgba(39,174,96,0.08)',   border: 'rgba(39,174,96,0.3)',   icon: '✅' },
    'annulee': { label: 'Annulée',  color: '#e74c3c', bg: 'rgba(231,76,60,0.08)',   border: 'rgba(231,76,60,0.3)',   icon: '🚫' },
  };

  readonly STATUT_PREUVE: Record<string, { label: string; color: string }> = {
    'aucune':               { label: 'Aucune preuve',      color: '#7a7870' },
    'en_attente_validation':{ label: 'En attente valida.', color: '#f39c12' },
    'validee':              { label: 'Validée',            color: '#27ae60' },
    'rejetee':              { label: 'Rejetée',            color: '#e74c3c' },
    'non_requise':          { label: 'Non requise',        color: '#2a9d8f' },
  };

  readonly MODES_PAIEMENT = [
    { value: 'especes',      label: 'Espèces' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque',       label: 'Chèque' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSection('toutes');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ── NAVIGATION
  setSection(section: ActiveSection): void {
    this.activeSection = section;
    this.loadSection(section);
  }

  loadSection(section: ActiveSection): void {
    if (section === 'toutes') this.loadCommandes();
    else if (section === 'preuves') this.loadPreuves();
    else if (section === 'impayes') this.loadImpayes();
  }

  // ── CHARGEMENTS
  loadCommandes(): void {
    this.isLoadingCommandes = true;
    const url = this.statutFilter
      ? `${API_URL}/commandes/admin/toutes?statut=${this.statutFilter}`
      : `${API_URL}/commandes/admin/toutes`;

    this.http.get<{ commandes: Commande[] }>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.allCommandes = res.commandes;
          this.filteredCommandes = res.commandes;
          this.isLoadingCommandes = false;
        },
        error: () => {
          this.showToast('Erreur chargement des commandes');
          this.isLoadingCommandes = false;
        }
      });
  }

  loadPreuves(): void {
    this.isLoadingPreuves = true;
    this.http.get<{ preuves: PaiementInfo[] }>(`${API_URL}/commandes/admin/preuves-en-attente`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.preuves = res.preuves;
          this.isLoadingPreuves = false;
        },
        error: () => {
          this.showToast('Erreur chargement des preuves');
          this.isLoadingPreuves = false;
        }
      });
  }

  loadImpayes(): void {
    this.isLoadingImpayes = true;
    this.http.get<{ paiements: PaiementInfo[] }>(`${API_URL}/commandes/admin/a-encaisser`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.impayes = res.paiements;
          this.isLoadingImpayes = false;
        },
        error: () => {
          this.showToast('Erreur chargement des impayés');
          this.isLoadingImpayes = false;
        }
      });
  }

  // ── FILTRE COMMANDES
  applyStatutFilter(): void {
    this.loadCommandes();
  }

  // ── MODAL PREUVE
  ouvrirPreuve(preuve: PaiementInfo): void {
    this.preuveSelectionnee = preuve;
    this.decisionNote = '';
    this.isPreuveModalOpen = true;
  }

  fermerPreuve(): void {
    this.isPreuveModalOpen = false;
    this.preuveSelectionnee = null;
  }

  validerPreuve(): void {
    if (!this.preuveSelectionnee) return;
    this.isSubmittingDecision = true;
    this.http.patch(`${API_URL}/commandes/admin/valider-preuve/${this.preuveSelectionnee._id}`, {
      decision: 'valider',
      note: this.decisionNote
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast('✅ Preuve validée — commande confirmée');
        this.fermerPreuve();
        this.loadPreuves();
        this.isSubmittingDecision = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message ?? 'Erreur lors de la validation');
        this.isSubmittingDecision = false;
      }
    });
  }

  rejeterPreuve(): void {
    if (!this.preuveSelectionnee) return;
    this.isSubmittingDecision = true;
    this.http.patch(`${API_URL}/commandes/admin/valider-preuve/${this.preuveSelectionnee._id}`, {
      decision: 'rejeter',
      note: this.decisionNote
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast('Preuve rejetée. Client notifié.');
        this.fermerPreuve();
        this.loadPreuves();
        this.isSubmittingDecision = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message ?? 'Erreur lors du rejet');
        this.isSubmittingDecision = false;
      }
    });
  }

  // ── MODAL PAIEMENT DIRECT
  ouvrirPaiementDirect(p: PaiementInfo): void {
    this.paiementDirectCible = p;
    this.paiementDirectForm = { modePaiement: 'especes', referenceTransaction: '', note: '' };
    this.isPaiementDirectModalOpen = true;
  }

  fermerPaiementDirect(): void {
    this.isPaiementDirectModalOpen = false;
    this.paiementDirectCible = null;
  }

  confirmerPaiementDirect(): void {
    if (!this.paiementDirectCible) return;
    const commandeId = this.paiementDirectCible.commande?._id;
    if (!commandeId) return;

    this.isSubmittingPaiementDirect = true;
    this.http.post(`${API_URL}/commandes/admin/enregistrer/${commandeId}`, {
      modePaiement: this.paiementDirectForm.modePaiement,
      referenceTransaction: this.paiementDirectForm.referenceTransaction || undefined,
      note: this.paiementDirectForm.note || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showToast('✅ Paiement enregistré avec succès');
        this.fermerPaiementDirect();
        this.loadImpayes();
        this.isSubmittingPaiementDirect = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message ?? 'Erreur enregistrement paiement');
        this.isSubmittingPaiementDirect = false;
      }
    });
  }

  // ── MODAL DÉTAIL COMMANDE
  ouvrirDetailCommande(commande: Commande): void {
    this.commandeDetail = commande;
    this.isDetailCommandeOpen = true;
  }

  fermerDetailCommande(): void {
    this.isDetailCommandeOpen = false;
    this.commandeDetail = null;
  }

  // ── HELPERS
  getStatutConfig(statut: string) {
    return this.STATUT_COMMANDE[statut] ?? { label: statut, color: '#7a7870', bg: 'rgba(122,120,112,0.08)', border: 'rgba(122,120,112,0.3)', icon: '—' };
  }

  getPreuveConfig(statut: string) {
    return this.STATUT_PREUVE[statut] ?? { label: statut, color: '#7a7870' };
  }

  formatMontant(val: any): string {
    const n = typeof val === 'object' && val?.$numberDecimal ? parseFloat(val.$numberDecimal) : Number(val);
    return isNaN(n) ? '0' : n.toLocaleString('fr-FR');
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getClientEmail(c: Commande): string {
    return c.clientID?.email ?? 'Client inconnu';
  }

  getNombreArticles(c: Commande): number {
    return c.lignes?.length ?? 0;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 3500);
  }
}
