// src/app/services/dossier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class DossierService {
  private url = `${API_URL}/DossierCM`;

  constructor(private http: HttpClient) {}

  // ── CLIENT ───────────────────────────────────────────────────────────────

  // GET /DossierCM/required/:reservationId
  // Appeler AVANT upload — retourne la liste des docs requis selon typeClient
  getDocumentsRequis(reservationId: string): Observable<{
    typeClient: string;
    obligatoire: boolean;
    documentsRequis: { id: string; nom: string; description: string | null }[];
  }> {
    return this.http.get<any>(`${this.url}/required/${reservationId}`);
  }

  // POST /DossierCM/soumettre/:reservationId
  // fieldname de chaque fichier = ID du TypeDocument
  // ex: files = { '64abc': fileCIN, '64def': fileNIF }
  soumettreDossiers(reservationId: string, files: { [typeDocId: string]: File }): Observable<{
    message: string;
    demandeId: string;
    dossiers: string[];
  }> {
    const formData = new FormData();
    for (const [typeDocId, file] of Object.entries(files)) {
      formData.append(typeDocId, file);
    }
    return this.http.post<any>(`${this.url}/soumettre/${reservationId}`, formData);
  }

  // GET /DossierCM/mes-dossiers/:reservationId
  getMesDossiers(reservationId: string): Observable<{
    typeClient: string;
    dossierComplet: boolean;
    progression: string;
    obligatoiresManquants: string[];
    documents: any[];
  }> {
    return this.http.get<any>(`${this.url}/mes-dossiers/${reservationId}`);
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────

  // GET /DossierCM/admin/dossier-client/:clientId
  getDossiersClient(clientId: string): Observable<{
    client: { id: string; email: string; typeClient: string };
    dossierComplet: boolean;
    progression: string;
    documents: any[];
  }> {
    return this.http.get<any>(`${this.url}/admin/dossier-client/${clientId}`);
  }

  // GET /DossierCM/all-demande-client?statusDm=
  // statusDm: 'en attente' | 'accepte' | 'refuse'
  getAllDemandesClient(statusDm: string = 'en attente'): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/all-demande-client?statusDm=${encodeURIComponent(statusDm)}`);
  }
}
