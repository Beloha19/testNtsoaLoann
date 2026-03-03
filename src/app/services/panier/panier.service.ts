import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Panier, PanierItem } from '../../models/panier.model';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = 'http://localhost:5000/panier';

  constructor(private http: HttpClient) {}

  getPanier(): Observable<Panier> {
    return this.http.get<Panier>(`${this.apiUrl}/voirPanier`);
  }

  ajouterAuPanier(produitId: string, quantite: number, prixUnitaire: number, taille?: string): Observable<Panier> {
    return this.http.post<Panier>(`${this.apiUrl}/ajouterPanier`, { produitId, quantite, prixUnitaire, taille });
  }

  modifierQuantite(produitId: string, quantite: number): Observable<Panier> {
    return this.http.put<Panier>(`${this.apiUrl}/modifier/${produitId}`, { quantite });
  }

  supprimerArticle(produitId: string): Observable<Panier> {
    return this.http.delete<Panier>(`${this.apiUrl}/supprimer/${produitId}`);
  }

  viderPanier(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vider`);
  }
}
