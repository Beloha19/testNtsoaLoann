import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

export interface PaiementAdmin {
  _id: string;
  client: { _id: string; email: string; telephone: string } | null;
  local: { nom_boutique: string; emplacement: string } | null;
  moisLabel: string;
  moisConcerne: string;
  dateEcheance: string;
  montantDu: number;
  montantPaye: number;
  resteAPayer: number;
  statut: string;
  modePaiement: string | null;
  referenceTransaction: string | null;
  statutPreuve: string | null;
  preuveUrl?: string | null;
  joursRetard: number;
  soumisLe?: string;
  note?: string | null;
}

type Onglet = 'impayes' | 'preuves' | 'client';

@Component({
  selector: 'app-admin-paiements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NavbarComponent, FooterComponent],
  templateUrl: './admin-paiements.component.html',
  styleUrls: ['./admin-paiements.component.scss']
})
export class AdminPaiementsComponent implements OnInit, OnDestroy {

  ongletActif: Onglet = 'preuves';

  // Données
  impayes: PaiementAdmin[] = [];
  preuves: PaiementAdmin[] = [];
  loyersClient: any[] = [];
  clientInfo: any = null;
  clientResume: any = null;

  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  private destroy$ = new Subject<void>();

  // Recherche client
  clientIdInput = '';

  // Modal décision preuve
  isDecisionModalOpen = false;
  paiementSelectionne: PaiementAdmin | null = null;
  decisionType: 'valider' | 'rejeter' = 'valider';
  montantValide = 0;
  noteDecision = '';
  isSubmitting = false;

  // Modal enregistrement direct
  isEnregistrementModalOpen = false;
  paiementEnregistrement: PaiementAdmin | null = null;
  montantEnregistre = 0;
  modeEnregistrement: 'mvola' | 'orange_money' | 'especes' = 'especes';
  refEnregistrement = '';
  noteEnregistrement = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Si clientId en query param → ouvrir onglet client direct
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['clientId']) {
        this.clientIdInput = params['clientId'];
        this.ongletActif = 'client';
        this.loadLoyersClient();
      }
    });
    this.loadImpayes();
    this.loadPreuves();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  setOnglet(o: Onglet): void {
    this.ongletActif = o;
    if (o === 'impayes') this.loadImpayes();
    if (o === 'preuves') this.loadPreuves();
  }

  // ── CHARGEMENTS ───────────────────────────────────────────
  loadImpayes(): void {
    this.isLoading = true;
    this.http.get<any>(`${API_URL}/PaimentCm/admin/a-encaisser`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => { this.impayes = d.paiements ?? []; this.isLoading = false; },
        error: () => { this.showToast('Erreur chargement impayés', 'error'); this.isLoading = false; }
      });
  }

  loadPreuves(): void {
    this.isLoading = true;
    this.http.get<any>(`${API_URL}/PaimentCm/admin/preuves-en-attente`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => { this.preuves = d.preuves ?? []; this.isLoading = false; },
        error: () => { this.showToast('Erreur chargement preuves', 'error'); this.isLoading = false; }
      });
  }

  loadLoyersClient(): void {
    if (!this.clientIdInput.trim()) return;
    this.isLoading = true;
    this.http.get<any>(`${API_URL}/PaimentCm/admin/client/${this.clientIdInput.trim()}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.loyersClient = d.loyers ?? [];
          this.clientInfo = d.client;
          this.clientResume = d.resume;
          this.isLoading = false;
        },
        error: () => { this.showToast('Client introuvable', 'error'); this.isLoading = false; }
      });
  }

  // ── MODAL DÉCISION PREUVE ─────────────────────────────────
  ouvrirDecision(paiement: PaiementAdmin, type: 'valider' | 'rejeter'): void {
    this.paiementSelectionne = paiement;
    this.decisionType = type;
    this.montantValide = paiement.montantDu;
    this.noteDecision = '';
    this.isDecisionModalOpen = true;
  }

  fermerDecision(): void { this.isDecisionModalOpen = false; this.paiementSelectionne = null; }

  confirmerDecision(): void {
    if (!this.paiementSelectionne) return;
    this.isSubmitting = true;

    const body: any = {
      decision: this.decisionType,
      note: this.noteDecision || undefined
    };
    if (this.decisionType === 'valider') {
      body.montantPaye = this.montantValide;
    }

    this.http.patch<any>(
      `${API_URL}/PaimentCm/admin/valider-preuve/${this.paiementSelectionne._id}`,
      body
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.fermerDecision();
        const msg = this.decisionType === 'valider' ? 'Preuve validée ✓' : 'Preuve rejetée';
        this.showToast(msg, 'success');
        this.loadPreuves();
        this.loadImpayes();
        if (this.ongletActif === 'client') this.loadLoyersClient();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast(err?.error?.message ?? 'Erreur', 'error');
      }
    });
  }

  // ── MODAL ENREGISTREMENT DIRECT ───────────────────────────
  ouvrirEnregistrement(paiement: PaiementAdmin): void {
    this.paiementEnregistrement = paiement;
    this.montantEnregistre = paiement.resteAPayer || paiement.montantDu;
    this.modeEnregistrement = 'especes';
    this.refEnregistrement = '';
    this.noteEnregistrement = '';
    this.isEnregistrementModalOpen = true;
  }

  fermerEnregistrement(): void { this.isEnregistrementModalOpen = false; this.paiementEnregistrement = null; }

  confirmerEnregistrement(): void {
    if (!this.paiementEnregistrement || !this.montantEnregistre) return;
    this.isSubmitting = true;

    this.http.post<any>(
      `${API_URL}/PaimentCm/admin/enregistrer/${this.paiementEnregistrement._id}`,
      {
        montantPaye: this.montantEnregistre,
        modePaiement: this.modeEnregistrement,
        referenceTransaction: this.refEnregistrement || undefined,
        note: this.noteEnregistrement || undefined
      }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.fermerEnregistrement();
        this.showToast(res.message ?? 'Paiement enregistré ✓', 'success');
        this.loadImpayes();
        this.loadPreuves();
        if (this.ongletActif === 'client') this.loadLoyersClient();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showToast(err?.error?.message ?? 'Erreur', 'error');
      }
    });
  }

  // ── HELPERS ───────────────────────────────────────────────
  formatPrix(m: number): string {
    if (!m && m !== 0) return '—';
    return m.toLocaleString('fr-FR') + ' Ar';
  }

  getStatutColor(statut: string): string {
    const map: Record<string, string> = {
      'paye': '#3daa8f', 'en attente': '#a8a49c',
      'en retard': '#d9534f', 'impaye': '#c0392b'
    };
    return map[statut] ?? '#a8a49c';
  }

  ouvrirPreuve(url: string): void { window.open(url, '_blank'); }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 4500);
  }
}
