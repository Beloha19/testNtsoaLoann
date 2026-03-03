import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VenteItem {
  produitId: string | { _id: string; nom: string; images: string[] };
  taille?: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Vente {
  _id: string;
  reference: string;
  date: string;
  boutiqueId: string;
  clientId?: string;
  clientNom?: string;
  clientEmail?: string;
  typeCommande: 'en ligne' | 'en boutique';
  commandeId?: string;
  fraisLivraison: number;
  items: VenteItem[];
  total: number;
  statut: 'en cours' | 'payé' | 'annulé';
  paiement: { methode: string; refTrans?: string };
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class VenteService {
  private apiUrl = 'http://localhost:5000/vente';

  constructor(private http: HttpClient) {}

  getVentesAttente(): Observable<Vente[]> {
    return this.http.get<Vente[]>(`${this.apiUrl}/attente`);
  }

  confirmerVente(id: string): Observable<Vente> {
    return this.http.put<Vente>(`${this.apiUrl}/confirmer/${id}`, {});
  }

  annulerVente(id: string): Observable<Vente> {
    return this.http.put<Vente>(`${this.apiUrl}/annuler/${id}`, {});
  }

  creerVente(data: any): Observable<{ message: string; vente: Vente }> {
    return this.http.post<{ message: string; vente: Vente }>(`${this.apiUrl}/faireVente`, data);
  }

  imprimerTicket(vente: Vente): void {
    window.open(`http://localhost:5000/vente/ticket/${vente._id}`, '_blank');
  }

}
