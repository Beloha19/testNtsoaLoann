import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boutique } from '../../models/boutique.model';
import {Produit} from '../../models/produit.model';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {
  private apiUrl = 'http://localhost:5000/produit';

  constructor(private http: HttpClient) {}

  getProduitsBoutique(boutiqueId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/produitsBoutique/${boutiqueId}`);
  }

  ajouterProduit(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/ajouterProduit`, formData);
  }

  modifierProduit(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/modifierProduit/${id}`, formData);
  }

  supprimerProduit(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/supprimerProduit/${id}`);
  }

  getProduitsPublic(boutiqueId: string): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/produitsBoutique/${boutiqueId}`);
  }

  getProduitById(id: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.apiUrl}/infoProduit/${id}`);
  }

  rechercherProduits(params: any): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.apiUrl}/rechercherProduits`, {params});
  }

}
