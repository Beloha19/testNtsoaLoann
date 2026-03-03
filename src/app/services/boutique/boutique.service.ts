import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Boutique } from '../../models/boutique.model';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  getRestaurants(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.apiUrl}/boutique/listeRestaurants`);
  }

  getBoutiquesHorsRestauration(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.apiUrl}/boutique/boutiques-hors-restauration`);
  }

  getBoutiqueInfo(id: string): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/boutique/infoBoutique/${id}`);
  }


}
