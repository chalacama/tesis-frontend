import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { WatchingService } from '../../../../../core/api/watching/watching.service';
import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';

import { ContentResponse } from '../../../../../core/api/watching/content.interface';
import { catchError, distinctUntilChanged, filter, map, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';
import { LikeResponse, SavedResponse } from '../../../../../core/api/feedback/feedback.interface';
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent, AvatarComponent],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly watchingSvc = inject(WatchingService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedbackSvc = inject(FeedbackService);
  // state
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<ContentResponse | null>(null);
  readonly liking = signal(false);
readonly saving = signal(false);
  // YouTube: cacheamos el embed URL para no tocarlo en likes/saves
  readonly ytEmbedRaw = signal<string | null>(null);
  readonly ytSafeSrc = computed<SafeResourceUrl | null>(() => {
    const raw = this.ytEmbedRaw();
    return raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  });

  // helpers
  readonly isYouTube = computed(() => (this.data()?.learning_meta?.type || '').toLowerCase() === 'youtube');
  readonly isArchive = computed(() => ['archivo','archive','file'].includes((this.data()?.learning_meta?.type || '').toLowerCase()));
  readonly isVideoFile = computed(() => ['mp4','webm','ogg','mov','m4v'].includes((this.data()?.learning_meta?.format || '').toLowerCase()));



  ngOnInit(): void {
    // Escuchar cambios de capítulo en el padre
    const parent = this.route.parent ?? this.route;

    parent.paramMap.pipe(
      map(pm => pm.get('chapterId')),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap((chapterId) =>
        this.watchingSvc.getChapterContent(chapterId).pipe(
          catchError(err => {
            this.error.set(err?.error?.message || 'No se pudo cargar el contenido.');
            return of(null);
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      if (res) {
        this.data.set(res);
                        
        this.data.set(res);
           
        this.updateYouTubeEmbedFromResponse(res); 

        // <-- SOLO aquí tocamos el src del iframe
      }
      this.loading.set(false);
    });

    // Primera carga por snapshot (por si acaso)
    const initialId = parent.snapshot.paramMap.get('chapterId');
    if (initialId) {
      this.loading.set(true);
      this.watchingSvc.getChapterContent(initialId).subscribe({
        next: (res) => { 
          this.data.set(res); 
          this.updateYouTubeEmbedFromResponse(res);
          this.loading.set(false); 
        },
        error: (err) => { 
          this.error.set(err?.error?.message || 'No se pudo cargar el contenido.'); 
          this.loading.set(false); 
        }
      });
    }
  }

  /** Calcula y fija el embed URL solo cuando es YouTube y cambian url/segundo inicial */
  private updateYouTubeEmbedFromResponse(res: ContentResponse | null): void {
    if (res && (res.learning_meta?.type || '').toLowerCase() === 'youtube' && res.learning_content?.url) {
      const start = res.last_view?.second_seen || 0;
      const embed = this.buildYouTubeEmbed(res.learning_content.url, start);
      this.ytEmbedRaw.set(embed);    // <-- se fija una sola vez por capítulo/cambio de start
    } else {
      this.ytEmbedRaw.set(null);
    }
  }

  // ---- UI Actions (optimistic) ----
  toggleLike(): void {
  const d = this.data(); if (!d) return;

  const chapterId = d.chapter.id;
  const prevLiked = d.user_state.liked_chapter;
  const nextLiked = !prevLiked;

  // Optimistic UI (no tocamos ytEmbedRaw)
  const prevLikes = d.likes_total ?? 0;
  this.data.set({
    ...d,
    user_state: { ...d.user_state, liked_chapter: nextLiked },
    likes_total: nextLiked ? prevLikes + 1 : Math.max(0, prevLikes - 1)
  });

  this.liking.set(true);
  this.feedbackSvc.setLiked(chapterId, nextLiked).subscribe({
    next: (res: LikeResponse) => {
      // Reconciliar por si backend difiere
      const cur = this.data(); if (!cur) return;
      if (res.liked !== cur.user_state.liked_chapter) {
        const likes = cur.likes_total ?? 0;
        this.data.set({
          ...cur,
          user_state: { ...cur.user_state, liked_chapter: res.liked },
          likes_total: res.liked
            ? likes + 1
            : Math.max(0, likes - 1)
        });
      }
      this.liking.set(false);
    },
    error: () => {
      // rollback
      const cur = this.data(); if (!cur) return;
      this.data.set({
        ...cur,
        user_state: { ...cur.user_state, liked_chapter: prevLiked },
        likes_total: prevLiked ? prevLikes : Math.max(0, prevLikes)
      });
      this.liking.set(false);
    }
  });
}

toggleSaved(): void {
  const d = this.data(); if (!d) return;

  const courseId = d.chapter.module_id ? d.chapter.module_id : undefined;
  // Si prefieres usar el courseId real del curso, añádelo en la respuesta y úsalo aquí.
  // Como mínimo, desde rutas tienes :id (courseId) en el padre:
  const routeCourseId = this.route.parent?.snapshot.paramMap.get('id');
  const targetCourseId = courseId ?? routeCourseId;
  if (!targetCourseId) return;

  const prevSaved = d.user_state.is_saved;
  const nextSaved = !prevSaved;

  // Optimistic UI (no tocamos ytEmbedRaw)
  this.data.set({ ...d, user_state: { ...d.user_state, is_saved: nextSaved } });

  this.saving.set(true);
  this.feedbackSvc.setSaved(targetCourseId, nextSaved).subscribe({
    next: (res: SavedResponse) => {
      // Reconciliar
      const cur = this.data(); if (!cur) return;
      if (res.saved !== cur.user_state.is_saved) {
        this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: res.saved } });
      }
      this.saving.set(false);
    },
    error: () => {
      // rollback
      const cur = this.data(); if (!cur) return;
      this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: prevSaved } });
      this.saving.set(false);
    }
  });
}

  onRegister(): void { console.log('Registro solicitado'); }

  // ---- Video helpers ----
  onVideoLoadedMetadata(video: HTMLVideoElement): void {
    const start = this.data()?.last_view?.second_seen || 0;
    try { if (start > 0 && video?.duration && start < video.duration) video.currentTime = start; } catch {}
  }

  // ---- YouTube helpers ----
  private buildYouTubeEmbed(rawUrl: string, startSec = 0): string | null {
    const id = this.extractYouTubeId(rawUrl);
    if (!id) return null;
    const params = new URLSearchParams({
      autoplay: '0', modestbranding: '1', rel: '0', controls: '1', fs: '1', playsinline: '1',
      ...(startSec ? { start: String(Math.floor(startSec)) } : {})
    });
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }

  private extractYouTubeId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const path = u.pathname.split('/'); const i = path.indexOf('embed');
      return i !== -1 && path[i+1] ? path[i+1] : null;
    } catch {
      const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return m?.[1] || null;
    }
  }
  
}
