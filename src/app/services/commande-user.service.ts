// src/app/services/commande.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private url = `${API_URL}/CommandeCM`;

  constructor(private http: HttpClient) {}

  // ── PANIER ───────────────────────────────────────────────────────────────

  // GET /CommandeCM/panier
  getPanier(): Observable<{ nombreArticles: number; total: number; items: any[] }> {
    return this.http.get<any>(`${this.url}/panier`);
  }

  // POST /CommandeCM/panier/ajouter
  // Body: { produitId, quantite }
  ajouterAuPanier(produitId: string, quantite: number = 1): Observable<any> {
    return this.http.post(`${this.url}/panier/ajouter`, { produitId, quantite });
  }

  // PATCH /CommandeCM/panier/:itemId
  // Body: { quantite }
  modifierQuantite(itemId: string, quantite: number): Observable<any> {
    return this.http.patch(`${this.url}/panier/${itemId}`, { quantite });
  }

  // DELETE /CommandeCM/panier/:itemId
  retirerDuPanier(itemId: string): Observable<any> {
    return this.http.delete(`${this.url}/panier/${itemId}`);
  }

  // DELETE /CommandeCM/panier
  viderPanier(): Observable<any> {
    return this.http.delete(`${this.url}/panier`);
  }

  // ── COMMANDE ─────────────────────────────────────────────────────────────

  // POST /CommandeCM/passer
  // Body: { note? }
  passerCommande(note?: string): Observable<{
    message: string;
    commandeId: string;
    numero: string;
    montantTotal: number;
    statut: string;
  }> {
    return this.http.post<any>(`${this.url}/passer`, { note });
  }

  // GET /CommandeCM/mes-commandes
  getMesCommandes(): Observable<{ total: number; commandes: any[] }> {
    return this.http.get<any>(`${this.url}/mes-commandes`);
  }

  // GET /CommandeCM/:commandeId
  getDetailCommande(commandeId: string): Observable<{ commande: any; paiement: any }> {
    return this.http.get<any>(`${this.url}/${commandeId}`);
  }

  // GET /CommandeCM/admin/toutes?statut=
  // statut: 'en attente paiement' | 'payee' | 'annulee'
  getAllCommandes(statut?: string): Observable<{ total: number; commandes: any[] }> {
    const params = statut ? `?statut=${encodeURIComponent(statut)}` : '';
    return this.http.get<any>(`${this.url}/admin/toutes${params}`);
  }

  // ── PAIEMENT COMMANDE ────────────────────────────────────────────────────

  // POST /CommandeCM/paiement/soumettre-preuve/:commandeId
  // modePaiement: 'mobile_money' | 'cheque'
  soumettrePreuve(commandeId: string, data: {
    preuve: File;
    modePaiement: 'mobile_money' | 'cheque';
    referenceTransaction?: string;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('preuve', data.preuve);
    formData.append('modePaiement', data.modePaiement);
    if (data.referenceTransaction) formData.append('referenceTransaction', data.referenceTransaction);
    return this.http.post(`${this.url}/paiement/soumettre-preuve/${commandeId}`, formData);
  }

  // GET /CommandeCM/admin/preuves-en-attente
  getPreuvesEnAttente(): Observable<{ total: number; preuves: any[] }> {
    return this.http.get<any>(`${this.url}/admin/preuves-en-attente`);
  }

  // PATCH /CommandeCM/admin/valider-preuve/:paiementId
  // Body: { decision: 'valider'|'rejeter', note? }
  validerPreuve(paiementId: string, data: {
    decision: 'valider' | 'rejeter';
    note?: string;
  }): Observable<any> {
    return this.http.patch(`${this.url}/admin/valider-preuve/${paiementId}`, data);
  }

  // POST /CommandeCM/admin/enregistrer/:commandeId
  // modePaiement: 'mobile_money' | 'cheque' | 'especes'
  enregistrerPaiement(commandeId: string, data: {
    modePaiement: 'mobile_money' | 'cheque' | 'especes';
    referenceTransaction?: string;
    note?: string;
  }): Observable<any> {
    return this.http.post(`${this.url}/admin/enregistrer/${commandeId}`, data);
  }

  // GET /CommandeCM/admin/a-encaisser
  getCommandesAEncaisser(): Observable<{ total: number; paiements: any[] }> {
    return this.http.get<any>(`${this.url}/admin/a-encaisser`);
  }
}
