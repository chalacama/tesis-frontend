import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HistoryItem, HistoryType, PaginatedResponse } from '../../../../../core/api/history/history.interface'; // ajusta rutas
import { HistoryService } from '../../../../../core/api/history/history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private history = inject(HistoryService);
  private destroyRef = inject(DestroyRef);

  items = signal<HistoryItem[]>([]);
  type = signal<HistoryType>('historial');
  page = signal(1);
  loadingInitial = signal(true);
  loadingMore = signal(false);
  nextPageUrl: string | null = null;

  @ViewChild('sentinel', { static: false }) sentinel?: ElementRef<HTMLElement>;
  private io?: IntersectionObserver;

  ngOnInit(): void {
    // Detecta el tipo por la ruta actual (historial|guardados|completados)
    const t = (this.route.snapshot.routeConfig?.path ?? 'historial') as HistoryType;
    this.type.set(t);
    this.fetch(true);

    // Si reusan el mismo componente para otras rutas, escucha cambios:
    this.route.url.subscribe(() => {
      const nt = (this.route.snapshot.routeConfig?.path ?? 'historial') as HistoryType;
      if (nt !== this.type()) {
        this.type.set(nt);
        this.resetAndFetch();
      }
    });
  }

  ngAfterViewInit(): void {
    // IntersectionObserver para scroll infinito
    this.io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && this.nextPageUrl && !this.loadingMore()) {
        this.loadMore();
      }
    }, { rootMargin: '600px 0px 0px 0px' }); // precarga
    if (this.sentinel?.nativeElement) this.io.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }

  private fetch(initial = false) {
    if (initial) {
      this.loadingInitial.set(true);
      this.page.set(1);
    } else {
      this.loadingMore.set(true);
    }

    this.history.index({ type: this.type(), page: this.page() })
      .subscribe({
        next: (res: PaginatedResponse<HistoryItem>) => {
          const merged = initial ? res.data : [...this.items(), ...res.data];
          this.items.set(merged);
          this.nextPageUrl = res.next_page_url;
          this.loadingInitial.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loadingInitial.set(false);
          this.loadingMore.set(false);
        }
      });
  }

  private resetAndFetch() {
    this.items.set([]);
    this.nextPageUrl = null;
    this.fetch(true);
  }

  loadMore() {
    if (!this.nextPageUrl) return;
    this.page.update(p => p + 1);
    this.fetch(false);
  }

  // Helpers UI
  ownerDisplay(o: HistoryItem['owner']) {
    const name = [o?.name, o?.lastname].filter(Boolean).join(' ').trim();
    return name || `@${o?.username ?? 'usuario'}`;
  }

  ownerAvatar(o: HistoryItem['owner']): { url: string | null, initials: string } {
    const url = o?.profile_picture_url || null;
    const src = `${o?.name ?? ''} ${o?.lastname ?? ''}`.trim() || o?.username || 'U';
    const initials = src.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('') || 'U';
    return { url, initials };
  }
}

