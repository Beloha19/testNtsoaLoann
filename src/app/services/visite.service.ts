// src/app/services/visite.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class VisiteService {
  private url = `${API_URL}/VisiteCM`;

  constructor(private http: HttpClient) {}

  // GET /VisiteCM/all-visite
  getAllVisites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/all-visite`);
  }

  // GET /VisiteCM/all-visite-non anuullé
  getAllVisitesNonAnnulé(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/all-visite-non-annule`);
  }

  // GET /VisiteCM/visite-local/:localId
  getVisitesByLocal(localId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/visite-local/${localId}`);
  }

  // GET /VisiteCM/date-visite-disponibles/:localId?month=&year=&day=
  getDatesDisponibles(localId: string, month?: string, year?: string, day?: string): Observable<any[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year)  params = params.set('year', year);
    if (day)   params = params.set('day', day);
    return this.http.get<any[]>(`${this.url}/date-visite-disponibles/${localId}`, { params });
  }

  // POST /VisiteCM/Reserved-visit/:id_client
  reserverVisite(clientId: string, data: {
    localeID: string;
    date: string;        // format: 'YYYY-MM-DD'
    heure_debut: string; // format: 'HH:mm'
    heure_fin: string;
  }): Observable<any> {
    return this.http.post(`${this.url}/Reserved-visit/${clientId}`, data);
  }

  // PATCH /VisiteCM/:id/annuler
  annulerVisite(visiteId: string): Observable<any> {
    return this.http.patch(`${this.url}/${visiteId}/annuler`, {});
  }
}
