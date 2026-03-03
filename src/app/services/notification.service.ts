import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';
import { API_URL } from '../config/api.config';

export interface Notification {
  _id: string;
  titre: string;
  message: string;
  type: 'info' | 'paiement' | 'retard' | 'alerte';
  lienAction?: string;
  lu: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private url = `${API_URL}/notifications`;

  private _notifications = new BehaviorSubject<Notification[]>([]);
  private _nonLuesCount  = new BehaviorSubject<number>(0);

  notifications$ = this._notifications.asObservable();
  nonLuesCount$  = this._nonLuesCount.asObservable();

  private initialized = false; // ← évite les doubles appels

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {}

  // ← plus besoin de userId en paramètre, le token JWT fait le travail
  init(userId?: string): void {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Charger les notifs existantes via le token Bearer (interceptor)
    this.http.get<Notification[]>(`${this.url}/mes-notifications`).subscribe({
      next: (notifs) => {
        this._notifications.next(notifs);
        this._majCount(notifs);
      },
      error: (err) => console.error('Chargement notifications:', err)
    });

    // 2. Connecter socket + rejoindre room privée (si userId dispo)
    if (userId) {
      this.socketService.connect();
      this.socketService.rejoindre(userId);

      // 3. Écouter les nouvelles notifications en temps réel
      this.socketService.on<Notification>('nouvelle_notification', (notif) => {
        const current = [notif, ...this._notifications.getValue()];
        this._notifications.next(current);
        this._majCount(current);
      });
    }
  }

  toggleLu(id: string): void {
    this.http.patch<Notification>(`${this.url}/${id}/toggle-lu`, {}).subscribe({
      next: (updated) => {
        const current = this._notifications.getValue().map(n => n._id === id ? updated : n);
        this._notifications.next(current);
        this._majCount(current);
      },
      error: (err) => console.error('Toggle lu:', err)
    });
  }

  marquerToutesLues(): void {
    this.http.patch(`${this.url}/marquer-toutes-lues`, {}).subscribe({
      next: () => {
        const current = this._notifications.getValue().map(n => ({ ...n, lu: true }));
        this._notifications.next(current);
        this._nonLuesCount.next(0);
      },
      error: (err) => console.error('Marquer toutes lues:', err)
    });
  }

  private _majCount(notifs: Notification[]): void {
    this._nonLuesCount.next(notifs.filter(n => !n.lu).length);
  }

  ngOnDestroy(): void {
    this.socketService.off('nouvelle_notification');
    this.socketService.disconnect();
    this.initialized = false;
  }
}
