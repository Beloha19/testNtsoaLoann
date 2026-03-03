import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  connect(serverUrl: string = 'http://localhost:5000'): void {
    if (this.socket?.connected) return;
    this.socket = io(serverUrl, { withCredentials: true });
  }

  rejoindre(userId: string): void {
    this.socket?.emit('rejoindre', userId);
  }

  on<T>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
