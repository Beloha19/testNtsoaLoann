import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthAdminService {
  private apiUrl = 'http://localhost:5000/admin';

  constructor(private http: HttpClient) {}

  login(email: string, mdp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connexion`, { email, mdp });
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
  }
}
