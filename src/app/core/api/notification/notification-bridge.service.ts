import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationBridgeService {
  // Contador global de notificaciones no leídas
  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  /** Fijar el valor inicial desde el backend */
  setCount(count: number) {
    this._unreadCount.set(Math.max(0, count ?? 0));
  }

  /** Incrementar badge (por ejemplo, cuando se emite un certificado) */
  increment(by: number = 1) {
    if (by <= 0) return;
    this._unreadCount.update(c => c + by);
  }

  /** Decrementar badge (cuando se lee una notificación) */
  decrement(by: number = 1) {
    if (by <= 0) return;
    this._unreadCount.update(c => Math.max(0, c - by));
  }

  /** Poner el badge en cero (marcar todas como leídas) */
  clear() {
    this._unreadCount.set(0);
  }
}

