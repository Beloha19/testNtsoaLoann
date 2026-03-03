import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { API_URL } from '../../config/api.config';

export interface MonContrat {
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

interface ResumePaiement {
  totalDu: number;
  totalPaye: number;
  totalRestant: number;
  moisRestants: number;
  nombreEnRetard: number;
}

@Component({
  selector: 'app-mon-contrat',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './client-contrat.component.html',
  styleUrls: ['./client-contrat.component.scss']
})
export class MonContratComponent implements OnInit, OnDestroy {

  contrats: MonContrat[] = [];
  resumePaiement: ResumePaiement | null = null;

  isLoading = false;
  erreur: string | null = null;
  toastMessage = '';
  isToastVisible = false;

  private toastTimer: any;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMonContrat();
    this.loadResumePaiement();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  loadMonContrat(): void {
    this.isLoading = true;
    this.erreur = null;

    const token = localStorage.getItem('token');
    console.log('Token utilisé:', token);

    this.http.get<MonContrat[]>(`${API_URL}/ResponseDm/mon-contrat`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Contrats reçus:', data); // ← vérifier
          this.contrats = data;
          this.isLoading = false;
          if (!data.length) {
            this.erreur = 'Aucun contrat actif trouvé pour votre compte.';
          }
        },
        error: (err) => {
          console.error('Erreur contrat:', err); // ← voir le vrai status
          this.isLoading = false;
          this.erreur = 'Erreur lors du chargement de vos contrats.';
        }
      });
  }

  loadResumePaiement(): void {
    this.http.get<any>(`${API_URL}/PaimentCm/mes-loyers`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.resumePaiement = res.resume;
        },
        error: () => {
          console.error('Erreur chargement paiements');
        }
      });
  }

  get progressionPaiement(): number {
    if (!this.resumePaiement || this.resumePaiement.totalDu === 0) return 0;
    return Math.round(
      (this.resumePaiement.totalPaye / this.resumePaiement.totalDu) * 100
    );
  }

  apercuContrat(contrat: MonContrat): void {
    this.ouvrirPDF(contrat, false);
  }

  ouvrirContrat(contrat: MonContrat): void {
    this.ouvrirPDF(contrat, true);
  }

  private ouvrirPDF(contrat: MonContrat, download: boolean): void {
    if (!contrat?.demandeId) return;

    const newTab = window.open('', '_blank');
    if (!newTab) {
      this.showToast('Autorisez les popups pour ce site');
      return;
    }

    this.http.post<{ tempToken: string }>(
      `${API_URL}/ResponseDm/contrat-token/${contrat.demandeId}`, {}
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tempToken }) => {
          let url = `${API_URL}/ResponseDm/contrat-apercu/${contrat.demandeId}?token=${tempToken}`;
          if (download) {
            url = `${API_URL}/ResponseDm/contrat/${contrat.demandeId}`;
          }
          newTab.location.href = url;
        },
        error: () => {
          newTab.close();
          this.showToast('Impossible d\'ouvrir le contrat');
        }
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
