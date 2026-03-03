// src/app/services/paiement-loyer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class PaiementLoyerService {
  private url = `${API_URL}/PaiementCM`;

  constructor(private http: HttpClient) {}

  // ── CLIENT ───────────────────────────────────────────────────────────────

  // GET /PaiementCM/mes-loyers
  getMesLoyers(): Observable<{ resume: any; loyers: any[] }> {
    return this.http.get<any>(`${this.url}/mes-loyers`);
  }

  // POST /PaiementCM/soumettre-preuve/:paiementId
  // modePaiement: 'mvola' | 'orange_money'
  soumettrePreuve(paiementId: string, data: {
    preuve: File;
    modePaiement: 'mvola' | 'orange_money';
    referenceTransaction?: string;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('preuve', data.preuve);
    formData.append('modePaiement', data.modePaiement);
    if (data.referenceTransaction) formData.append('referenceTransaction', data.referenceTransaction);
    return this.http.post(`${this.url}/soumettre-preuve/${paiementId}`, formData);
  }

  // GET /PaiementCM/notifications
  getNotifications(): Observable<{ nonLues: number; notifications: any[] }> {
    return this.http.get<any>(`${this.url}/notifications`);
  }

  // PATCH /PaiementCM/notifications/:id/lu
  marquerNotificationLue(notifId: string): Observable<any> {
    return this.http.patch(`${this.url}/notifications/${notifId}/lu`, {});
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────

  // GET /PaiementCM/admin/client/:clientId
  getLoyersClient(clientId: string): Observable<any> {
    return this.http.get<any>(`${this.url}/admin/client/${clientId}`);
  }

  // GET /PaiementCM/admin/a-encaisser
  getLoyersAEncaisser(): Observable<{ total: number; paiements: any[] }> {
    return this.http.get<any>(`${this.url}/admin/a-encaisser`);
  }

  // GET /PaiementCM/admin/preuves-en-attente
  getPreuvesEnAttente(): Observable<{ total: number; preuves: any[] }> {
    return this.http.get<any>(`${this.url}/admin/preuves-en-attente`);
  }

  // PATCH /PaiementCM/admin/valider-preuve/:paiementId
  // decision: 'valider' | 'rejeter'
  validerPreuve(paiementId: string, data: {
    decision: 'valider' | 'rejeter';
    montantPaye?: number;
    note?: string;
  }): Observable<any> {
    return this.http.patch(`${this.url}/admin/valider-preuve/${paiementId}`, data);
  }

  // POST /PaiementCM/admin/enregistrer/:paiementId
  // modePaiement: 'mvola' | 'orange_money' | 'especes'
  enregistrerPaiement(paiementId: string, data: {
    montantPaye: number;
    modePaiement: 'mvola' | 'orange_money' | 'especes';
    referenceTransaction?: string;
    note?: string;
  }): Observable<any> {
    return this.http.post(`${this.url}/admin/enregistrer/${paiementId}`, data);
  }
}
