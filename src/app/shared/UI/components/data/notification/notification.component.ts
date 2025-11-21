import {
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { IconComponent } from '../../button/icon/icon.component';
import {
  ApiNotification,
} from '../../../../../core/api/notification/notification.interface';
import { NotificationService } from '../../../../../core/api/notification/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationBridgeService } from '../../../../../core/api/notification/notification-bridge.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
})
export class NotificationComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // estado
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly notifications = signal<ApiNotification[]>([]);
  /* readonly unreadCount = signal(0); */
  readonly page = signal(1);
  readonly hasMore = signal(true);
  readonly initialized = signal(false);
  readonly error = signal<string | null>(null);
  private readonly bridge = inject(NotificationBridgeService);

  readonly unreadCount = this.bridge.unreadCount;
  // solo para skeletons
  readonly skeletonItems = Array.from({ length: 4 });

  constructor() {
    this.loadUnreadCount();
  }

  /** Badge inicial en la campanita */
  private loadUnreadCount(): void {
    this.notificationService
      .getUnreadCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.ok) {
            this.bridge.setCount(res.count ?? 0);
          }
        },
        error: () => {
          // si falla, simplemente no mostramos badge
        },
      });
  }

  toggleOpen(): void {
    this.open.update((v) => !v);

    // la primera vez que se abre, cargamos notificaciones
    if (this.open() && !this.initialized()) {
      this.loadNotifications(true);
      this.initialized.set(true);
    }
  }

  /** Cargar notificaciones (reset = true para recargar desde página 1) */
  loadNotifications(reset = false): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    const targetPage = reset ? 1 : this.page() + 1;

    this.notificationService
      .getNotifications({
        page: targetPage,
        perPage: 10,
        unreadOnly: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const items = res.data ?? [];

          if (reset) {
            this.notifications.set(items);
          } else {
            this.notifications.update((prev) => [...prev, ...items]);
          }

          this.page.set(res.meta.current_page ?? targetPage);
          const lastPage = res.meta.last_page ?? targetPage;
          this.hasMore.set(this.page() < lastPage);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar las notificaciones.');
          this.loading.set(false);
        },
      });
  }

  loadMore(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.hasMore() || this.loading()) return;
    this.loadNotifications(false);
  }

  /** Click en una notificación */
  onNotificationClick(notification: ApiNotification, event: MouseEvent): void {
    event.stopPropagation();

    const wasUnread = !notification.read_at;

    if (wasUnread) {
      this.notificationService
        .markAsRead(notification.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // actualizar localmente
            this.notifications.update((list) =>
              list.map((n) =>
                n.id === notification.id
                  ? { ...n, read_at: new Date().toISOString() }
                  : n
              )
            );
            this.bridge.decrement(1);
            
          },
          error: () => {
            // si falla, no rompemos el flujo
          },
        });
    }

    const url = notification.data?.url;
    if (url) {
      this.open.set(false);
      this.router.navigateByUrl(url);
    }
  }

  /** Marcar todas como leídas */
  onMarkAllAsRead(event: MouseEvent): void {
    event.stopPropagation();

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.ok) {
            const nowIso = new Date().toISOString();
            this.notifications.update((list) =>
              list.map((n) => ({
                ...n,
                read_at: n.read_at ?? nowIso,
              }))
            );
            this.bridge.clear();
          }
        },
        error: () => {
          // ignoramos error visualmente por ahora
        },
      });
  }

  trackById(_: number, item: ApiNotification): string {
    return item.id;
  }
}
