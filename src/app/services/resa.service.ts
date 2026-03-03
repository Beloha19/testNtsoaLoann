// src/app/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private url = `${API_URL}/ResaCM`;

  constructor(private http: HttpClient) {}

  // POST /ResaCM/add-reservation
  creerReservation(data: {
    localeID: string;
    clientId: string;
    infoLoc: { dure: number; prix: number };
  }): Observable<any> {
    return this.http.post(`${this.url}/add-reservation`, data);
  }

  // PUT /ResaCM/Update-resa/:idResa
  updateReservation(resaId: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/Update-resa/${resaId}`, data);
  }

  // GET /ResaCM/all-Reservation?etat_filtered=
  // status: 'Confirmée' | 'En attente' | 'Annulée'
  getAllReservations(status?: string): Observable<any[]> {
    const params = status ? `?etat_filtered=${status}` : '';
    return this.http.get<any[]>(`${this.url}/all-Reservation${params}`);
  }

  // GET /ResaCM/Reservation-client/:id_client
  getReservationClient(clientId: string): Observable<any> {
    return this.http.get(`${this.url}/Reservation-client/${clientId}`);
  }
}
