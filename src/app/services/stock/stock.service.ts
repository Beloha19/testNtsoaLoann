import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'http://localhost:5000/stock';

  constructor(private http: HttpClient) {}

  ajouterStock(data: { produitId: string; taille?: string; quantite: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/ajouterStock`, data);
  }

  getStockParProduit(produitId: string): Observable<{ taille: string; quantite: number }[]> {
    return this.http.get<any>(`${this.apiUrl}/infoStockProduit/${produitId}`).pipe(
      map(response => {
        if (response && response.stockParTaille) {
          return response.stockParTaille.map((item: any) => ({
            taille: item._id,
            quantite: item.total
          }));
        }
        return [];
      })
    );
  }
}
