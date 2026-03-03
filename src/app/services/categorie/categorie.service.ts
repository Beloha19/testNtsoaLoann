import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categorie } from '../../models/categorie.model';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private apiUrl = 'http://localhost:5000/categorie';

  constructor(private http: HttpClient) {}

  getCategoriesHorsRestauration(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/listeCategoriesHorsRestauration`);
  }

  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.apiUrl}/listeCategories`);
  }

}
