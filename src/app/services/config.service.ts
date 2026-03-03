// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private url = `${API_URL}/ConfigCM`;

  constructor(private http: HttpClient) {}

  // ── TYPE CLIENT ──────────────────────────────────────────────────────────

  // GET /ConfigCM/type-client
  getAllTypeClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/type-client`);
  }

  // DELETE /ConfigCM/type-client/:id
  deleteTypeClient(id: string): Observable<any> {
    return this.http.delete(`${this.url}/type-client/${id}`);
  }

  // ── TYPE DOSSIER ─────────────────────────────────────────────────────────

  // GET /ConfigCM/Afficher-all-type-dossier
  getAllTypeDossiers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/Afficher-all-type-dossier`);
  }

  // POST /ConfigCM/type-dossier
  // Body: { nom: string, description?: string }
  createTypeDossier(data: { nom: string; description?: string }): Observable<any> {
    return this.http.post(`${this.url}/type-dossier`, data);
  }

  // DELETE /ConfigCM/type-dossier/:id
  deleteTypeDossier(id: string): Observable<any> {
    return this.http.delete(`${this.url}/type-dossier/${id}`);
  }

  // ── DOSSIER REQUIREMENT ──────────────────────────────────────────────────

  // GET /ConfigCM/dossier-requirement
  getAllDossierRequirements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/dossier-requirement`);
  }

  // GET /ConfigCM/dossier-requirement/:id
  getDossierRequirement(id: string): Observable<any> {
    return this.http.get(`${this.url}/dossier-requirement/${id}`);
  }

  // POST /ConfigCM/dossier-requirement-typeClient
  // Body: { typeClientex: string, typeDocument: string[], obligatoire: boolean }
  createDossierRequirement(data: {
    typeClientex: string;
    typeDocument: string[];
    obligatoire: boolean;
  }): Observable<any> {
    return this.http.post(`${this.url}/dossier-requirement-typeClient`, data);
  }

  // PUT /ConfigCM/update-dossier-requirement/:id
  // Body: { typeDocument: string[], obligatoire?: boolean }
  updateDossierRequirement(id: string, data: {
    typeDocument: string[];
    obligatoire?: boolean;
  }): Observable<any> {
    return this.http.put(`${this.url}/update-dossier-requirement/${id}`, data);
  }

  // DELETE /ConfigCM/dossier-requirement/:id
  deleteDossierRequirement(id: string): Observable<any> {
    return this.http.delete(`${this.url}/dossier-requirement/${id}`);
  }
}
