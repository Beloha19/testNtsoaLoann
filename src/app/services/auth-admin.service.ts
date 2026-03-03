// services/auth-admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthAdminService {
  private apiUrl = 'http://localhost:5000/admin';
  private adminStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentAdminSubject = new BehaviorSubject<AdminUser | null>(this.getAdminFromToken());

  constructor(private http: HttpClient) {}

  login(email: string, mdp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connexion`, { email, mdp }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
          const adminInfo = this.decodeToken(response.token);
          this.currentAdminSubject.next(adminInfo);
          this.adminStatusSubject.next(true);
        }
      })
    );
  }

  setToken(token: string): void {
    localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    this.adminStatusSubject.next(false);
    this.currentAdminSubject.next(null);
  }

  // Vérifie si un token existe dans localStorage
  private hasToken(): boolean {
    return !!this.getToken();
  }

  // Observable pour suivre le statut admin en temps réel
  isAdmin$(): Observable<boolean> {
    return this.adminStatusSubject.asObservable();
  }

  // Observable pour suivre les infos de l'admin connecté
  currentAdmin$(): Observable<AdminUser | null> {
    return this.currentAdminSubject.asObservable();
  }

  // Décode le token JWT
  private decodeToken(token: string): AdminUser | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role
      };
    } catch (e) {
      console.error('Erreur de décodage du token', e);
      return null;
    }
  }

  // Récupère les infos de l'admin à partir du token stocké
  private getAdminFromToken(): AdminUser | null {
    const token = this.getToken();
    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }

  // Récupère le nom d'affichage de l'admin (basé sur l'email)
  getAdminDisplayName(): string {
    const currentAdmin = this.currentAdminSubject.value;
    if (currentAdmin?.email) {
      // Extrait la partie avant le @ de l'email
      return currentAdmin.email.split('@')[0] || 'Admin';
    }
    return 'Admin';
  }

  // Récupère l'email de l'admin
  getAdminEmail(): string | null {
    const currentAdmin = this.currentAdminSubject.value;
    return currentAdmin?.email || null;
  }

  // Récupère l'ID de l'admin
  getAdminId(): string | null {
    const currentAdmin = this.currentAdminSubject.value;
    return currentAdmin?.id || null;
  }

  // Récupère le rôle de l'admin
  getAdminRole(): string | null {
    const currentAdmin = this.currentAdminSubject.value;
    return currentAdmin?.role || null;
  }

  // Récupère toutes les infos de l'admin connecté
  getCurrentAdmin(): AdminUser | null {
    return this.currentAdminSubject.value;
  }
}
