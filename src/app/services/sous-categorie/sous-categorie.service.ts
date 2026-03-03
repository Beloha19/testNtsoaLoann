import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SousCategorie {
  _id: string;
  nom: string;
}

@Injectable({
  providedIn: 'root'
})
export class SousCategoriesService {
  private apiUrl = 'http://localhost:5000/sousCategorie';

  constructor(private http: HttpClient) {}

  getSousCategoriesByCategorie(categorieId: string): Observable<SousCategorie[]> {
    return this.http.get<SousCategorie[]>(`${this.apiUrl}/sousCategoriesCat/${categorieId}`);
  }
}
