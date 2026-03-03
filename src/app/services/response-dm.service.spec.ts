// src/app/services/response-dm.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ResponseDmService {
  private url = `${API_URL}/ResponseDm`;

  constructor(private http: HttpClient) {}

  // ── ADMIN ────────────────────────────────────────────────────────────────

  // GET /ResponseDm/demandes?statut=
  // statut: 'en attente' | 'accepte' | 'refuse'
  getAllDemandes(statut?: string): Observable<any[]> {
    const params = statut ? `?statut=${encodeURIComponent(statut)}` : '';
    return this.http.get<any[]>(`${this.url}/demandes${params}`);
  }

  // PUT /ResponseDm/valider/:demandeId
  // Body: { statut: 'accepte'|'refuse', commentaire? }
  validerDemande(demandeId: string, data: {
    statut: 'accepte' | 'refuse';
    commentaire?: string;
  }): Observable<any> {
    return this.http.put(`${this.url}/valider/${demandeId}`, data);
  }

  // GET /ResponseDm/detail/:demandeId
  // Retourne contrat + client + local + infoLoc + boutique
  getDetailDemande(demandeId: string): Observable<{
    contrat: any;
    client: any;
    local: any;
    infoLoc: {
      duree: number;
      prixMensuel: number;
      totalContrat: number;
      dateDebut: string;
      dateFin: string;
      statusReservation: string;
    };
    boutique: any | null;
  }> {
    return this.http.get<any>(`${this.url}/detail/${demandeId}`);
  }

  // ── CLIENT ───────────────────────────────────────────────────────────────

  // GET /ResponseDm/ma-demande/:demandeId
  getMaDemande(demandeId: string): Observable<{
    statusDm: string;
    dateDm: string;
    reponse: {
      statut: string;
      commentaire: string;
      dateReponse: string;
      contratDisponible: boolean;
      contratURL: string | null;
    } | null;
  }> {
    return this.http.get<any>(`${this.url}/ma-demande/${demandeId}`);
  }

  // GET /ResponseDm/contrat/:demandeId — télécharge le PDF
  telechargerContrat(demandeId: string): Observable<Blob> {
    return this.http.get(`${this.url}/contrat/${demandeId}`, { responseType: 'blob' });
  }

  // Helper — ouvre le PDF dans un nouvel onglet
  ouvrirContratPDF(demandeId: string): void {
    this.telechargerContrat(demandeId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }
}
