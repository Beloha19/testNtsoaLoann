import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  getUserId(): string | null {
    const user = this.getUser();
    return user ? user.id : null;
  }

  login(email: string, mdp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/connexion`, { email, mdp });
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/inscription`, userData);
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
