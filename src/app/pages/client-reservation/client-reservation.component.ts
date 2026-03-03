import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';

export interface Reservation {
  _id: string;
  localeID: { _id: string; nom_boutique: string } | null;
  infoLoc: { dure: number; prix: any };
  status: string;
  createdAt: string;
}

export interface DocumentRequis {
  id: string;
  nom: string;
  description?: string | null;
}

@Component({
  selector: 'app-client-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './client-reservation.component.html',
  styleUrls: ['./client-reservation.component.scss']
})
export class ClientReservationsComponent implements OnInit, OnDestroy {

  reservations: Reservation[] = [];
  isLoading = false;
  toastMessage = '';
  isToastVisible = false;
  private toastTimer: any;

  dossierStatuts = new Map<string, 'soumis'>();
  dossierCompletEnBase = new Map<string, boolean>();

  // ── MODAL ÉTAPE 1 : gardé uniquement pour affichage informatif
  isChoixTypeModalOpen = false;
  selectedTypeClient: 'SOCIETE' | 'INDIVIDU' | null = null;
  reservationEnCours: Reservation | null = null;

  // ── MODAL ÉTAPE 2 : upload dossiers
  isDossierModalOpen = false;
  isLoadingDocs = false;
  isSubmitting = false;
  documentsRequis: DocumentRequis[] = [];
  obligatoire = false;
  uploadedFiles: Record<string, File> = {};
  dragOverId: string | null = null;
  typeClientLabel = '';
  reservationIdCourant: string | null = null;

  clientId: string = this.getClientIdFromToken();

  readonly STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    'En attente': { label: 'En attente', color: '#c4a05a', bg: 'rgba(196,160,90,0.08)', border: 'rgba(196,160,90,0.3)', icon: '⏳' },
    'Confirmée':  { label: 'Confirmée',  color: '#2a9d8f', bg: 'rgba(42,157,143,0.08)', border: 'rgba(42,157,143,0.3)', icon: '✅' },
    'Annulée':    { label: 'Annulée',    color: '#e74c3c', bg: 'rgba(231,76,60,0.08)',  border: 'rgba(231,76,60,0.3)',  icon: '❌' },
  };

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}
  ngOnInit(): void {
    console.log('token:', this.getToken());
    console.log('clientId:', this.clientId);
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  private getClientIdFromToken(): string {
    try {
      const token = this.getToken();
      if (!token) return '';
      const payload = token.split('.')[1];
      const padding = '=='.slice((payload.length % 4) || 4);
      const decoded = JSON.parse(atob(payload + padding));
      return decoded.id || decoded._id || '';
    } catch {
      return '';
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }


  loadReservations(): void {
    console.log('→ loadReservations appelé, clientId:', this.clientId);
    if (!this.clientId) {
      this.showToast('Impossible de récupérer l\'identifiant client');
      return;
    }
    this.isLoading = true;
    this.http.get<Reservation | Reservation[]>(`${API_URL}/ReservationCM/Reservation-client`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('→ data reçue:', data);
          this.reservations = Array.isArray(data) ? data : [data];
          this.isLoading = false;
          this.reservations.forEach(r => this.verifierDossierComplet(r._id));
        },

        error: (err) => {
          console.error('→ erreur:', err);
          this.showToast('Erreur lors du chargement des réservations');
          this.isLoading = false;
        }
      });
  }
  ouvrirChoixTypeClient(reservation: Reservation): void {
    if (this.dossierCompletEnBase.get(reservation._id)) return;
    this.reservationEnCours = reservation;
    this.reservationIdCourant = reservation._id;
    this.uploadedFiles = {};
    this.documentsRequis = [];
    this.isLoadingDocs = true;
    this.isDossierModalOpen = true;
    this.chargerDocumentsRequis(reservation._id);
  }

  // ── Ces méthodes sont gardées au cas où le modal étape 1 est encore dans le HTML
  closeChoixTypeModal(): void {
    this.isChoixTypeModalOpen = false;
    this.reservationEnCours = null;
    this.selectedTypeClient = null;
  }

  selectTypeClient(type: 'SOCIETE' | 'INDIVIDU'): void {
    this.selectedTypeClient = type;
  }

  passerAuDossier(): void {
    if (!this.reservationEnCours) return;
    this.isChoixTypeModalOpen = false;
    this.reservationIdCourant = this.reservationEnCours._id;
    this.uploadedFiles = {};
    this.documentsRequis = [];
    this.isLoadingDocs = true;
    this.isDossierModalOpen = true;
    this.chargerDocumentsRequis(this.reservationIdCourant);
  }

  // ── VÉRIFICATION DOSSIER COMPLET EN BASE
  verifierDossierComplet(reservationId: string): void {
    this.http.get<any>(`${API_URL}/DemandeLocationCM/mes-dossiers/${reservationId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data.dossierComplet) {
            this.dossierCompletEnBase.set(reservationId, true);
            this.dossierStatuts.set(reservationId, 'soumis');
          }
        },
        error: () => {}
      });
  }

  // ── CHARGEMENT DES DOCUMENTS REQUIS
  // Le backend lit typeClient depuis le user en base → aucun param à envoyer
  chargerDocumentsRequis(reservationId: string): void {
    this.http.get<any>(`${API_URL}/DemandeLocationCM/required/${reservationId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.documentsRequis = data.documentsRequis || [];
          this.obligatoire = data.obligatoire ?? true;
          this.typeClientLabel = data.typeClient || '';
          this.isLoadingDocs = false;
        },
        error: (err) => {
          this.showToast(err?.error?.message ?? 'Aucun document configuré pour ce type de profil');
          this.isLoadingDocs = false;
          this.isDossierModalOpen = false;
        }
      });
  }

  closeDossierModal(): void {
    this.isDossierModalOpen = false;
    this.uploadedFiles = {};
    this.documentsRequis = [];
    this.reservationIdCourant = null;
    this.typeClientLabel = '';
    this.reservationEnCours = null;
  }

  // ── UPLOAD FICHIERS
  triggerFileInput(docId: string): void {
    document.getElementById('file-' + docId)?.click();
  }

  onFileSelected(event: Event, docId: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.uploadedFiles = { ...this.uploadedFiles, [docId]: input.files[0] };
    }
  }

  onDragOver(event: DragEvent, docId: string): void {
    event.preventDefault();
    this.dragOverId = docId;
  }

  onDragLeave(): void {
    this.dragOverId = null;
  }

  onDrop(event: DragEvent, docId: string): void {
    event.preventDefault();
    this.dragOverId = null;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadedFiles = { ...this.uploadedFiles, [docId]: file };
  }

  removeFile(event: Event, docId: string): void {
    event.stopPropagation();
    const copy = { ...this.uploadedFiles };
    delete copy[docId];
    this.uploadedFiles = copy;
  }

  tousLesFichiersPresents(): boolean {
    if (!this.obligatoire) return true;
    return this.documentsRequis.every(doc => !!this.uploadedFiles[doc.id]);
  }

  // ── SOUMISSION DU DOSSIER
  soumettreLesDossiers(): void {
    if (!this.reservationIdCourant) return;

    this.isSubmitting = true;
    const formData = new FormData();

    for (const doc of this.documentsRequis) {
      const file = this.uploadedFiles[doc.id];
      if (file) formData.append(doc.id, file, file.name);
    }

    this.http.post<any>(`${API_URL}/DemandeLocationCM/soumettre/${this.reservationIdCourant}`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (this.reservationIdCourant) {
            this.dossierStatuts.set(this.reservationIdCourant, 'soumis');
          }
          this.closeDossierModal();
          this.showToast(`Dossier soumis avec succès ✅ (demande #${res.demandeId?.slice(-6) ?? ''})`);
        },
        error: (err) => {
          this.isSubmitting = false;
          if (err?.status === 409) {
            const docId = err?.error?.typeDossier;
            const docConcerne = this.documentsRequis.find(d => String(d.id) === String(docId));
            const nomDoc = docConcerne?.nom ?? 'un document';
            this.showToast(`${nomDoc} a déjà été soumis et ne peut pas être re-envoyé`);
          } else {
            this.showToast(err?.error?.message ?? 'Erreur lors de la soumission');
          }
        }
      });
  }

  // ── HELPERS
  getDossierStatus(resaId: string): 'soumis' | null {
    return this.dossierStatuts.get(resaId) ?? null;
  }

  getStatusConfig(status: string | null | undefined) {
    if (!status) return {
      label: '—', color: '#7a7870', icon: '—',
      bg: 'rgba(122,120,112,0.08)', border: 'rgba(122,120,112,0.3)'
    };
    return this.STATUS_CONFIG[status] ?? {
      label: status, color: '#7a7870', icon: '—',
      bg: 'rgba(122,120,112,0.08)', border: 'rgba(122,120,112,0.3)'
    };
  }

  getLocalNom(r: Reservation): string {
    return (r.localeID as any)?.nom_boutique ?? 'Local inconnu';
  }

  formatPrix(prix: any): string {
    if (!prix) return '—';
    const n = typeof prix === 'object' && prix.$numberDecimal
      ? Number(prix.$numberDecimal)
      : Number(prix);
    return n.toLocaleString('fr-FR');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    this.isToastVisible = true;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.isToastVisible = false, 4000);
  }
}
