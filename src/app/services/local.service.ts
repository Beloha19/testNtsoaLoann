// src/app/services/local.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private url = `${API_URL}/LocaleCM`;

  constructor(private http: HttpClient) {}

  // GET /LocalCM/All-local
  getAllLocals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/All-local`);
  }

  // GET /LocalCM/local-availaible
  getLocalsDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/local-availaible`);
  }

  // GET /LocalCM/local-unavailaible
  getLocalsIndisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/local-unavailaible`);
  }

  // POST /LocalCM/add-newLocal
  createLocal(data: any): Observable<any> {
    return this.http.post(`${this.url}/add-newLocal`, data);
  }

  // PUT /LocalCM/:id
  updateLocal(id: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data);
  }

  // DELETE /LocalCM/:id
  deleteLocal(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
