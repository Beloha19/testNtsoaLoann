
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = `${API_URL}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, mdp: string): Observable<any> {
    return this.http.post(`${this.url}/login`, { email, mdp }).pipe(
      tap((res: any) => {
        if (res.token) {
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getUser(): any {
    const u = sessionStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getUserId(): string | null {
    return this.getUser()?._id || null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.roles?.includes('admin') || false;
  }

  isBoutique(): boolean {
    const user = this.getUser();
    return user?.roles?.includes('boutique') || false;
  }
}
