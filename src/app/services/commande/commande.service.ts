import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande } from '../../models/commande.model';

export interface Adresse {
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private apiUrl = 'http://localhost:5000/commande';

  constructor(private http: HttpClient) {}

  passerCommande(data: { typeLivraison: string; adresseLivraison?: string }): Observable<{ message: string; commande: Commande }> {
    return this.http.post<{ message: string; commande: Commande }>(`${this.apiUrl}/passerCommande`, data);
  }

  getMesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.apiUrl}/listeMesCommandes`);
  }
}
