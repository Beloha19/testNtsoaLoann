import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Boutique } from '../../models/boutique.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BoutiqueGestionService {
  private apiUrl = 'http://localhost:5000';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}


  getProfilBoutique(): Observable<Boutique> {
    return this.http.get<Boutique>(`${this.apiUrl}/boutique/maBoutique`).pipe(
      switchMap(boutique =>
        this.http.get<Boutique>(`${this.apiUrl}/boutique/infoBoutique/${boutique._id}`)
      )
    );
  }

  updateInfos(boutiqueId: string, data: Partial<Boutique>): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.apiUrl}/boutique/modifierInfoBoutique/${boutiqueId}`, data);
  }

  updateHoraires(boutiqueId: string, horaires: any[]): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.apiUrl}/boutique/modifierHoraireBoutique/${boutiqueId}/horaires`, { horaires });
  }

}
