import { Component, inject, signal, computed, DestroyRef, effect, untracked } from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { WatchingService } from '../../../../../core/api/watching/watching.service';
import { DetailResponse, Course, Collaborator } from '../../../../../core/api/watching/detail.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, catchError, of, distinctUntilChanged } from 'rxjs';

// Usa tu ui-avatar
import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';
import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, AvatarComponent],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css'
})
export class DetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly watching = inject(WatchingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bridge = inject(CourseBridge);
  loading = signal<boolean>(true);
  error   = signal<string | null>(null);
  course  = signal<Course | null>(null);

  // UI: título desde la ruta
  courseTitle = signal<string>('Detalles del curso');

  // UI: descripción “YouTube”
  descCollapsed = signal<boolean>(true);
  showDescToggle = computed<boolean>(() => {
    const t = this.course()?.description ?? '';
    return t.length > 220; // regla simple para mostrar "Mostrar más"
  });

  avgPercent = computed<number>(() => {
    const c = this.course();
    const pct = ((c?.ratings?.avg_stars ?? 0) / 5) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  });

    constructor() {
    // 🌉 PUENTE #2: cuando se actualice el rating desde el RatingComponent
    effect(() => {
      const summary = this.bridge.ratingSummary();
      if (!summary) return;

      // No queremos que el effect dependa de course(), así que usamos untracked
      untracked(() => {
        const current = this.course();
        if (!current) return;

        this.course.set({
          ...current,
          ratings: {
            ...(current as any).ratings,
            avg_stars: summary.avg_stars,
            count: summary.count,
            user_stars: summary.user_stars
          }
        });
      });
    });
  }


  ngOnInit() {
    this.route.paramMap
      .pipe(
        map(pm => this.resolveIdFromRoute(pm)),
        distinctUntilChanged((a, b) => a.id === b.id && a.title === b.title),
        switchMap(({ id, title }) => {
          this.courseTitle.set('Detalles del curso' + (title ? ` · ${this.prettyTitle(title)}` : ''));
          if (!id) {
            this.loading.set(false);
            this.error.set('No se encontró el curso en la ruta.');
            return of(null);
          }
          this.loading.set(true);
          this.error.set(null);
          return this.watching.getCourseDetail(id).pipe(
            catchError(err => {
              console.error(err);
              this.error.set('No se pudieron cargar los detalles del curso.');
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resp: DetailResponse | null) => {
        if (resp?.ok) this.course.set(resp.course);
        this.loading.set(false);
      });
  }

  toggleDesc() { this.descCollapsed.update(v => !v); }

  ratingLabel(): string {
    const c = this.course();
    return (c?.ratings?.avg_stars ?? 0).toFixed(1);
  }

  trackById(_: number, item: { id: number }) { return item.id; }

  initialsOf(c: Collaborator): string {
    const parts = `${c.name ?? ''} ${c.lastname ?? ''}`.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  // ---- helpers de ruta y texto ----
  private resolveIdFromRoute(pm: ParamMap): { id: string | null, title: string } {
    const parentPm = this.route.parent?.snapshot.paramMap;
    const id = pm.get('id') ?? parentPm?.get('id') ?? null;
    const title = pm.get('title') ?? parentPm?.get('title') ?? '';
    return { id, title };
  }

  private prettyTitle(raw: string): string {
    if (!raw) return '';
    const t = decodeURIComponent(raw.replace(/\+/g, ' ')).replace(/-/g, ' ').trim();
    return t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Convierte URLs a links y #hashtags a spans, ambos en azul */
  
  descriptionHtml = computed<SafeHtml>(() => {
  const raw = this.course()?.description ?? '';
  return this.sanitizer.bypassSecurityTrustHtml(this.toRichHtml(raw));
});

/** Convierte URLs a links y #hashtags a spans, ambos en azul */
private toRichHtml(text: string): string {
  if (!text) return '';
  let out = this.escapeHtml(text);

  // URLs -> <a>
  const urlRe = /\b((?:https?:\/\/|www\.)[^\s<]+)/gi;
  out = out.replace(urlRe, (m: string, url: string) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a class="link" href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });

  // Hashtags dentro del texto -> <span class="hash">
  const hashRe = /(^|\s)#([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g;
  out = out.replace(hashRe, (_: string, sp: string, tag: string) => {
    return `${sp}<span class="hash">#${tag}</span>`;
  });

  // Párrafos y saltos de línea
  out = out.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
  return `<p>${out}</p>`;
}
goToPortfolio(username: string) {
  this.router.navigate(['learning/portfolio', '@' + username]);
}

}
