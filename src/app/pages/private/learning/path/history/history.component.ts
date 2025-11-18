import { CommonModule } from '@angular/common';
import {
  AfterViewInit, Component, DestroyRef, ElementRef, HostListener,
  OnDestroy, OnInit, ViewChild, inject, signal
} from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HistoryItem, HistoryType, PaginatedResponse } from '../../../../../core/api/history/history.interface';
import { HistoryService } from '../../../../../core/api/history/history.service';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';


@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private history = inject(HistoryService);
  private destroyRef = inject(DestroyRef);

  // Imagen por defecto (ponla en assets si puedes)
  readonly DEFAULT_COVER = 'img/cover/portada-miniature.png';

  items = signal<HistoryItem[]>([]);
  type = signal<HistoryType>('historial');
  page = signal(1);
  loadingInitial = signal(true);
  loadingMore = signal(false);
  nextPageUrl: string | null = null;

  // Menú "más"
  openMenuId = signal<number | null>(null);

  @ViewChild('sentinel', { static: false }) sentinel?: ElementRef<HTMLElement>;
  private io?: IntersectionObserver;

  ngOnInit(): void {
    const t = (this.route.snapshot.routeConfig?.path ?? 'historial') as HistoryType;
    this.type.set(t);
    this.fetch(true);

    this.route.url.subscribe(() => {
      const nt = (this.route.snapshot.routeConfig?.path ?? 'historial') as HistoryType;
      if (nt !== this.type()) {
        this.type.set(nt);
        this.resetAndFetch();
      }
    });
  }

  ngAfterViewInit(): void {
    this.io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && this.nextPageUrl && !this.loadingMore()) {
        this.loadMore();
      }
    }, { rootMargin: '600px 0px 0px 0px' });
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

  // Menú "más"
  toggleMenu(courseId: number, ev: MouseEvent) {
    ev.stopPropagation();
    this.openMenuId.set(this.openMenuId() === courseId ? null : courseId);
  }
  closeMenus() { this.openMenuId.set(null); }

  @HostListener('document:click')
  onDocClick() { this.closeMenus(); }

  // Acciones certificado
  // ...existing code...
  // Acciones certificado
  previewCertificate(code?: string) {
    if (!code) return;
    // crear la URL interna y convertirla a absoluta para abrir en nueva pestaña
    const tree = this.router.createUrlTree(['certificate', code]);
    const url = this.router.serializeUrl(tree);
    const fullUrl = `${window.location.origin}${url}`;
    const newWindow = window.open(fullUrl, '_blank');
    if (newWindow) newWindow.opener = null; // seguridad: evitar acceso al opener
    this.closeMenus();
  }
// ...existing code...

  downloadCertificate(code?: string) {
    if (!code) return;
    console.log(`Descargando certificado con código: ${code}`);
  }
  goToCourse(course: any) {
    this.router.navigate([`learning/course/${course.title}/${course.id}`]);
  }
}
