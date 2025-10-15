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
import { NavigationStart } from '@angular/router';
import {  ElementRef, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';

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

  @ViewChild('player') playerRef?: ElementRef<HTMLVideoElement>;   // <video>
@ViewChild('ytFrame') ytFrame?: ElementRef<HTMLIFrameElement>;   // <iframe YT>

private ytPlayer?: any;
private ytIntervalId?: number;

private readonly MIN_DELTA_SEC = 5;      // enviar si avanzó ≥5s
private readonly MAX_INTERVAL_MS = 15000; // o cada 15s como máximo
private lastSentSec = 0;
private lastSentAt = 0;
private progressBlocked = false;          // si backend responde 403, no insistir
private currentLcId: number | string | null = null;



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
    tap(() => { 
      this.loading.set(true); 
      this.error.set(null); 
      
      this.resetYouTubeTracking();           // limpia tracking previo
      this.currentLcId = null;
      this.lastSentSec = 0;
      this.lastSentAt = 0;
      this.progressBlocked = false;

    //   this.flushProgress();            // ⬅️ primero guardamos lo actual
    // this.resetYouTubeTracking();     // luego reseteamos
    // this.currentLcId = null;
    // this.lastSentSec = 0;
    // this.lastSentAt = 0;
    // this.progressBlocked = false;
    // this.loading.set(true);
    // this.error.set(null);
    }),
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
      this.updateYouTubeEmbedFromResponse(res);
      // Inicializa estado de progreso
      this.currentLcId = res.learning_content?.id ?? null;
      this.lastSentSec = Math.max(0, res.last_view?.second_seen || 0);
      this.lastSentAt = Date.now();

      // Si es YouTube, levanta el Player y el sondeo
      if (this.isYouTube()) {
        // espera un tick para que exista el iframe en el DOM
        setTimeout(() => this.setupYouTubeTracking(), 0);
      }
    }
    this.loading.set(false);
  });

  // Carga inicial por snapshot (opcional si ya tienes lo de arriba)
  const initialId = parent.snapshot.paramMap.get('chapterId');
  if (initialId) {
    this.loading.set(true);
    this.watchingSvc.getChapterContent(initialId).subscribe({
      next: (res) => { 
        this.data.set(res);
        this.updateYouTubeEmbedFromResponse(res);
        this.currentLcId = res?.learning_content?.id ?? null;
        this.lastSentSec = Math.max(0, res?.last_view?.second_seen || 0);
        this.lastSentAt = Date.now();
        if (this.isYouTube()) setTimeout(() => this.setupYouTubeTracking(), 0);
        this.loading.set(false);
      },
      error: (err) => { 
        this.error.set(err?.error?.message || 'No se pudo cargar el contenido.'); 
        this.loading.set(false); 
      }
    });
  }

  // Flush al ocultar pestaña o cerrar
  fromEvent(document, 'visibilitychange')
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => { if (document.visibilityState === 'hidden') this.flushProgress(); });

  fromEvent(window, 'beforeunload')
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => { this.flushProgress(); });

  this.destroyRef.onDestroy(() => {
    this.flushProgress();
    this.resetYouTubeTracking();
  });
  }
  private setupYouTubeTracking(): void {
  const iframe = this.ytFrame?.nativeElement;
  if (!iframe) return;

  this.ensureYouTubeApiLoaded(() => {
    // Reemplaza el iframe por un Player que expone getCurrentTime()
    this.ytPlayer = new window.YT.Player(iframe, {
      events: {
        onStateChange: (e: any) => this.onYTStateChange(e)
      }
    });
  });
}

private onYTStateChange(e: any): void {
  if (!window?.YT) return;
  const playing = e?.data === window.YT.PlayerState.PLAYING;
  const paused  = e?.data === window.YT.PlayerState.PAUSED;
  const ended   = e?.data === window.YT.PlayerState.ENDED;

  if (playing) {
    this.clearYtInterval();
    this.ytIntervalId = window.setInterval(() => {
      const t = Math.floor(this.ytPlayer?.getCurrentTime?.() || 0);
      this.maybeSendProgress(t);
    }, 2000); // sondeo cada 2s (enviamos cada ~5s por throttle)
  } else if (paused || ended) {
    const t = Math.floor(this.ytPlayer?.getCurrentTime?.() || 0);
    this.maybeSendProgress(t, true); // flush
    this.clearYtInterval();
  }
}

private ensureYouTubeApiLoaded(cb: () => void): void {
  if (window.YT?.Player) { cb(); return; }
  const existing = document.querySelector('script[src*="youtube.com/iframe_api"]') as HTMLScriptElement | null;
  if (existing) {
    // Ya se está cargando; cuélgate del callback global
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); cb(); };
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  window.onYouTubeIframeAPIReady = cb;
  document.head.appendChild(s);
}

private clearYtInterval(): void {
  if (this.ytIntervalId) {
    clearInterval(this.ytIntervalId);
    this.ytIntervalId = undefined;
  }
}

private resetYouTubeTracking(): void {
  this.clearYtInterval();
  this.ytPlayer = undefined;
}

  onVideoLoadedMetadata(video: HTMLVideoElement): void {
  const start = this.data()?.last_view?.second_seen || 0;
  try { if (start > 0 && video?.duration && start < video.duration) video.currentTime = start; } catch {}
}

onVideoTimeUpdate(video: HTMLVideoElement): void {
  this.maybeSendProgress(video.currentTime);
}
onVideoPause(video: HTMLVideoElement): void {
  this.maybeSendProgress(video.currentTime, true);  // flush al pausar
}
onVideoEnded(video: HTMLVideoElement): void {
  this.maybeSendProgress(video.duration || video.currentTime || 0, true);
}

  private maybeSendProgress(sec: number, force = false): void {
  if (!this.currentLcId || this.progressBlocked) return;

  const now = Date.now();
  sec = Math.max(0, Math.floor(sec));

  const advanced = sec - this.lastSentSec;
  const elapsed  = now - this.lastSentAt;

  if (!force && advanced < this.MIN_DELTA_SEC && elapsed < this.MAX_INTERVAL_MS) return;

  this.sendProgress(sec);
}

private sendProgress(sec: number): void {
  // actualiza marcadores locales primero (optimista)
  this.lastSentSec = sec;
  this.lastSentAt  = Date.now();

  this.feedbackSvc.setProgress(this.currentLcId!, sec)
    .pipe(
      catchError((err) => {
        // Si no está registrado (403), no insistas
        if (err?.status === 403) this.progressBlocked = true;
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe();
}

private flushProgress(): void {
  // Reenvía aunque no cumpla MIN_DELTA/intervalo
  if (!this.currentLcId) return;

  // Usa tiempo actual de video si aplica
  const video = this.playerRef?.nativeElement;
  if (video && !isNaN(video.currentTime)) {
    this.maybeSendProgress(video.currentTime, true);
    return;
  }

  // O tiempo de YT si aplica
  const t = Math.floor(this.ytPlayer?.getCurrentTime?.() || 0);
  if (t > 0) this.maybeSendProgress(t, true);
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
  // onVideoLoadedMetadata(video: HTMLVideoElement): void {
  //   const start = this.data()?.last_view?.second_seen || 0;
  //   try { if (start > 0 && video?.duration && start < video.duration) video.currentTime = start; } catch {}
  // }

  // ---- YouTube helpers ----
  // content.component.ts (método que ya tienes)
private buildYouTubeEmbed(rawUrl: string, startSec = 0): string | null {
  const id = this.extractYouTubeId(rawUrl);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: '0',
    modestbranding: '1',
    rel: '0',
    controls: '1',
    fs: '1',
    playsinline: '1',
    enablejsapi: '1',
    origin: location.origin,
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
