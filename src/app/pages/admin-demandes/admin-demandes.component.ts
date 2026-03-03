import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';
import {NavbarComponent} from '../../shared/navbar-admin/navbar.component';
import {FooterComponent} from '../../shared/footer-admin/footer.component';

// Pipe pour les URLs safe (iframe PDF)
@Pipe({ name: 'safe', standalone: true })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

export interface Demande {
  _id: string;
  clientID: {
    _id: string;
    email: string;
    telephone?: string;
    typeClient?: { typeClientex: string };
  } | null;
  dossierClientID: any;
  statusDm: string;
  createdAt: string;
}

export interface DossierDocument {
  typeDocumentId: string;
  present: boolean;
  obligatoire: boolean;
  status: string | null;
  cheminDossier: string | null;
  uploadedAt: string | null;
  nomDocument?: string;
  description?: string;
}

export interface DossierInfo {
  complet: boolean;
  progression: string;
  critique: boolean;
  documents: DossierDocument[];
}

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SafePipe, NavbarComponent, FooterComponent],
  templateUrl: './admin-demandes.component.html',
  styleUrls: ['./admin-demandes.component.scss']
})
export class AdminDemandesComponent implements OnInit, OnDestroy {

  demandes: Demande[] = [];
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  private toastTimer: any;

  // ── Map demandeId → DossierInfo (badge sur la liste)
  dossierInfoMap = new Map<string, DossierInfo>();

  // ── MODAL DETAIL ────────────────────────────────────────
  isDetailOpen = false;
  demandeDetail: Demande | null = null;
  dossierDetail: any = null;
  isLoadingDetail = false;
  previewUrl: string | null = null;
  commentaire = '';

  // ── APERÇU CONTRAT ──────────────────────────────────────
  isLoadingApercu = false;

  // ── MODAL CONFIRMATION ──────────────────────────────────
  isConfirmOpen = false;
  decisionEnCours: 'accepte' | 'refuse' | null = null;
  isSubmitting = false;

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void { this.loadDemandes(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  // ── CHARGEMENT DEMANDES ─────────────────────────────────
  loadDemandes(): void {
    this.isLoading = true;
    this.http.get<Demande[]>(`${API_URL}/DemandeLocationCM/all-demande-client?statusDm=en attente`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.demandes = data;
          this.isLoading = false;
          this.demandes.forEach(d => this.chargerDossierInfo(d));
        },
        error: () => {
          this.showToast('Erreur lors du chargement des demandes');
          this.isLoading = false;
        }
      });
  }

  // ── BADGE DOSSIER ───────────────────────────────────────
  chargerDossierInfo(demande: Demande): void {
    const clientId = demande.clientID?._id;
    if (!clientId) return;

    this.http.get<any>(`${API_URL}/DemandeLocationCM/admin/dossier-client/${clientId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const obligatoiresManquants = (data.documents || [])
            .filter((d: DossierDocument) => d.obligatoire && !d.present);

          const info: DossierInfo = {
            complet: data.dossierComplet,
            progression: data.progression,
            critique: obligatoiresManquants.length > 0,
            documents: data.documents || []
          };
          this.dossierInfoMap.set(demande._id, info);
        },
        error: () => {
          this.dossierInfoMap.set(demande._id, {
            complet: false,
            progression: '0/?',
            critique: true,
            documents: []
          });
        }
      });
  }

  getDossierInfo(demandeId: string): DossierInfo | null {
    return this.dossierInfoMap.get(demandeId) ?? null;
  }

  // ── MODAL DETAIL ────────────────────────────────────────
  ouvrirDetail(demande: Demande): void {
    this.demandeDetail = demande;
    this.dossierDetail = null;
    this.previewUrl = null;
    this.commentaire = '';
    this.isDetailOpen = true;
    this.isLoadingDetail = true;

    const clientId = demande.clientID?._id;
    if (!clientId) { this.isLoadingDetail = false; return; }

    this.http.get<any>(`${API_URL}/DemandeLocationCM/admin/dossier-client/${clientId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dossierDetail = data;
          this.isLoadingDetail = false;
        },
        error: () => {
          this.showToast('Erreur lors du chargement du dossier');
          this.isLoadingDetail = false;
        }
      });
  }

  fermerDetail(): void {
    this.isDetailOpen = false;
    this.demandeDetail = null;
    this.dossierDetail = null;
    this.previewUrl = null;
  }

  voirDocument(chemin: string): void {
    let url = chemin.startsWith('http')
      ? chemin
      : `${API_URL.replace('/api', '')}/${chemin}`;

    if (this.isImage(url)) {
      this.previewUrl = url;
    } else {
      this.previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }

    setTimeout(() => {
      document.querySelector('.ad-preview-zone')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  telechargerDocument(chemin: string): void {
    const url = chemin.startsWith('http') ? chemin : `${API_URL.replace('/api', '')}/${chemin}`;
    window.open(url, '_blank');
  }

  fermerPreview(): void { this.previewUrl = null; }

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  // ── APERÇU CONTRAT PRÉ-GÉNÉRATION ───────────────────────
  // ✅ window.open() AVANT le subscribe pour éviter le blocage popup navigateur
  apercuContrat(): void {
    if (!this.demandeDetail) return;
    this.isLoadingApercu = true;

    // ✅ Ouvrir l'onglet IMMÉDIATEMENT dans le même tick utilisateur (obligatoire)
    const newTab = window.open('', '_blank');
    if (!newTab) {
      this.showToast('Veuillez autoriser les popups pour ce site');
      this.isLoadingApercu = false;
      return;
    }

    // Afficher un loader pendant que la requête se fait
    newTab.document.write(`
      <html>
        <head>
          <title>Aperçu contrat…</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              display: flex; align-items: center; justify-content: center;
              height: 100vh; background: #0f0f0f; color: #fff;
              font-family: sans-serif;
            }
            .wrap { text-align: center; }
            .spinner {
              width: 40px; height: 40px;
              border: 3px solid #333; border-top-color: #fff;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin: 0 auto 16px;
            }
            p { color: #aaa; font-size: 14px; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="spinner"></div>
            <p>Génération de l'aperçu du contrat…</p>
          </div>
        </body>
      </html>
    `);

    this.http.post(
      `${API_URL}/ResponseDm/apercu-contrat`,
      { demandeId: this.demandeDetail._id, commentaire: this.commentaire },
      { responseType: 'text' }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (html) => {
          this.isLoadingApercu = false;
          // ✅ Écrire le HTML du contrat dans l'onglet déjà ouvert
          newTab.document.open();
          newTab.document.write(html);
          newTab.document.close();
        },
        error: () => {
          this.isLoadingApercu = false;
          newTab.close(); // Fermer l'onglet vide en cas d'erreur
          this.showToast('Erreur lors de la génération de l\'aperçu contrat');
        }
      });
  }

  // ── DÉCISION ────────────────────────────────────────────
  prendreDecision(decision: 'accepte' | 'refuse'): void {
    this.decisionEnCours = decision;
    this.isConfirmOpen = true;
  }

  fermerConfirm(): void {
    this.isConfirmOpen = false;
    this.decisionEnCours = null;
  }

  // PUT /ResponseDm/valider/:demandeId
  confirmerDecision(): void {
    if (!this.demandeDetail || !this.decisionEnCours) return;

    this.isSubmitting = true;

    this.http.put<any>(
      `${API_URL}/ResponseDm/valider/${this.demandeDetail._id}`,
      { statut: this.decisionEnCours, commentaire: this.commentaire }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.isConfirmOpen = false;
          this.isDetailOpen = false;

          const msg = this.decisionEnCours === 'accepte'
            ? 'Demande acceptée ✅ — Contrat PDF généré'
            : 'Demande refusée ❌';
          this.showToast(msg);

          this.demandes = this.demandes.filter(d => d._id !== this.demandeDetail?._id);
          this.demandeDetail = null;
          this.decisionEnCours = null;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.showToast(err?.error?.message ?? 'Erreur lors de la décision');
        }
      });
  }

  // ── HELPERS ─────────────────────────────────────────────
  hasMissingObligatoires(): boolean {
    return (this.dossierDetail?.documents || [])
      .some((d: DossierDocument) => d.obligatoire && !d.present);
  }

  getProgressionPct(progression: string): number {
    if (!progression) return 0;
    const parts = progression.split('/');
    if (parts.length !== 2) return 0;
    const num = parseInt(parts[0]);
    const den = parseInt(parts[1]);
    if (!den) return 0;
    return Math.round((num / den) * 100);
  }

  formatPrix(prix: any): string {
    if (!prix) return '—';
    const n = typeof prix === 'object' && prix.$numberDecimal
      ? Number(prix.$numberDecimal) : Number(prix);
    return n.toLocaleString('fr-FR') + ' Ar';
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 4500);
  }
}
