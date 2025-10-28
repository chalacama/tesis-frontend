import { Component, inject, OnInit, signal, computed, DestroyRef, ViewChild,  ViewChildren, ElementRef, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { WatchingService } from '../../../../../core/api/watching/watching.service';
import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';
import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';

import { ContentResponse } from '../../../../../core/api/watching/content.interface';
import { Subject, of, interval } from 'rxjs';
import {
  auditTime,
  catchError,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
  takeUntil
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';
import { LikeResponse, SavedResponse } from '../../../../../core/api/feedback/feedback.interface';
import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';
import { DialogComponent } from '../../../../../shared/UI/components/overlay/dialog/dialog.component';

declare global {
  interface Window { onYouTubeIframeAPIReady?: () => void; YT?: any; }
}

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, IconComponent, ButtonComponent, AvatarComponent , DialogComponent],
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
   private readonly bridge = inject(CourseBridge);
  @ViewChild('ytFrame') ytFrame?: ElementRef<HTMLIFrameElement>;
  
  // state
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<ContentResponse | null>(null);
  readonly liking = signal(false);
  readonly saving = signal(false);
   dialogCodeShow = false
  // YouTube embed cache (no re-render en likes/saves)
  readonly ytEmbedRaw = signal<string | null>(null);
  readonly ytSafeSrc = computed<SafeResourceUrl | null>(() => {
    const raw = this.ytEmbedRaw();
    return raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  });

  // helpers
  readonly isYouTube = computed(() => (this.data()?.learning_meta?.type || '').toLowerCase() === 'youtube');
  readonly isArchive = computed(() => ['archivo','archive','file'].includes((this.data()?.learning_meta?.type || '').toLowerCase()));
  readonly isVideoFile = computed(() => ['mp4','webm','ogg','mov','m4v'].includes((this.data()?.learning_meta?.format || '').toLowerCase()));

  // ---- Progreso en tiempo real ----
  private progress$ = new Subject<number>(); // segundos en vivo
  private lastSentSecond = -1;               // anti-duplicados
  private ytPlayer: any = null;              // instancia YT.Player
  private ytTickStop$ = new Subject<void>(); // parar polling YT

  private lastHtml5Time = 0; // último segundo visto en <video>
  private lastYtTime = 0;    // último segundo visto en YouTube

  // ---- Completed Chapter (progreso %)
private lastPercentReported = 0;     // último % reportado al backend
private readonly minDeltaPercent = 0.5; // evita spam: no mandar deltas < 0.5%
  // ---- Registro (OTP) ----
readonly otpLength = 7;
readonly otp = signal<string[]>(Array.from({ length: 7 }, () => ''));
readonly enrolling = signal(false);
readonly codeError = signal<string | null>(null);
@ViewChildren('otpBox') otpBoxes?: QueryList<ElementRef<HTMLInputElement>>;

  // ---------- Local backup ----------
  private resumeKey(lcId: number | string) { return `resume:${lcId}`; }
  private saveResumeLocal(lcId: number | string, sec: number) {
    try { localStorage.setItem(this.resumeKey(lcId), JSON.stringify({ sec: Math.floor(sec), ts: Date.now() })); } catch {}
  }
  private readResumeLocal(lcId: number | string): { sec: number, ts: number } | null {
    try {
      const raw = localStorage.getItem(this.resumeKey(lcId));
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (typeof v?.sec === 'number' && typeof v?.ts === 'number') return v;
    } catch {}
    return null;
  }
  isRegistered = computed(() => this.bridge.isRegistered());
  ngOnInit(): void {
     
    // a) Canal de progreso con throttling 4s
    this.progress$
      .pipe(
        map((s) => Math.max(0, Math.floor(s))),
        distinctUntilChanged(),
        auditTime(4000),
        switchMap((sec) => this.sendProgress(sec)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // b) Cargar contenido por capítulo
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
      if (res) this.setDataAndPreparePlayers(res);
      this.loading.set(false);
    });

    // c) Primera carga por snapshot
    const initialId = parent.snapshot.paramMap.get('chapterId');
    if (initialId) {
      this.loading.set(true);
      this.watchingSvc.getChapterContent(initialId).subscribe({
        next: (res) => { this.setDataAndPreparePlayers(res); this.loading.set(false); },
        error: (err) => { this.error.set(err?.error?.message || 'No se pudo cargar el contenido.'); this.loading.set(false); }
      });
    }

    // d) Flush al ocultar pestaña / salir / navegar
    const onVisibility = () => this.flushNowFromCurrentPlayer();
    const onBeforeUnload = () => this.flushNowFromCurrentPlayer(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    this.router.events
      .pipe(filter(ev => ev instanceof NavigationStart), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flushNowFromCurrentPlayer());

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      this.destroyYouTubePlayer();
    });
  }

  // -----------------------------
  // Carga/prepare players por tipo
  // -----------------------------
  private setDataAndPreparePlayers(res: ContentResponse) {
    // reset de memorias por capítulo
    this.lastPercentReported = 0;
    this.lastHtml5Time = 0;
    this.lastYtTime = 0;
    this.lastSentSecond = -1;

    // aplica respaldo local (si es más reciente que servidor)
    const lcId = res?.learning_content?.id;
    const serverSec = res?.last_view?.second_seen ?? 0;
    if (lcId != null) {
      const local = this.readResumeLocal(lcId);
      if (local && local.sec >= 0) {
        // si el local es más "nuevo" (por ts) o mayor segundo, úsalo como start y sinc al backend
        const useLocal = local.ts > (res?.last_view?.updated_at ? new Date(res.last_view.updated_at).getTime() : 0) || local.sec > serverSec;
        if (useLocal) {
          // “fake” update solo para el start visual; y dispara un POST para sincronizar
          res = { ...res, last_view: { ...res.last_view, second_seen: local.sec, updated_at: new Date(local.ts).toISOString() } as any };
          this.sendProgress(local.sec).subscribe();
        }
      }
    }

    this.data.set(res);
    this.updateYouTubeEmbedFromResponse(res);

    if (this.isYouTube()) {
      queueMicrotask(() => this.initYouTubePlayerIfNeeded());
    } else {
      this.destroyYouTubePlayer();
    }
  }

  /** Calcula y fija el embed URL de YouTube con enablejsapi y start */
  private updateYouTubeEmbedFromResponse(res: ContentResponse | null): void {
    if (res && (res.learning_meta?.type || '').toLowerCase() === 'youtube' && res.learning_content?.url) {
      const start = res.last_view?.second_seen || 0;
      const embed = this.buildYouTubeEmbed(res.learning_content.url, start);
      this.ytEmbedRaw.set(embed);
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

    const prevLikes = d.likes_total ?? 0;
    this.data.set({
      ...d,
      user_state: { ...d.user_state, liked_chapter: nextLiked },
      likes_total: nextLiked ? prevLikes + 1 : Math.max(0, prevLikes - 1)
    });

    this.liking.set(true);
    this.feedbackSvc.setLiked(chapterId, nextLiked).subscribe({
      next: (res: LikeResponse) => {
        const cur = this.data(); if (!cur) return;
        if (res.liked !== cur.user_state.liked_chapter) {
          const likes = cur.likes_total ?? 0;
          this.data.set({
            ...cur,
            user_state: { ...cur.user_state, liked_chapter: res.liked },
            likes_total: res.liked ? likes + 1 : Math.max(0, likes - 1)
          });
        }
        this.liking.set(false);
      },
      error: () => {
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

    const routeCourseId = this.route.parent?.snapshot.paramMap.get('id');
    if (!routeCourseId) return;

    const prevSaved = d.user_state.is_saved;
    const nextSaved = !prevSaved;

    this.data.set({ ...d, user_state: { ...d.user_state, is_saved: nextSaved } });

    this.saving.set(true);
    this.feedbackSvc.setSaved(routeCourseId, nextSaved).subscribe({
      next: (res: SavedResponse) => {
        const cur = this.data(); if (!cur) return;
        if (res.saved !== cur.user_state.is_saved) {
          this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: res.saved } });
        }
        this.saving.set(false);
      },
      error: () => {
        const cur = this.data(); if (!cur) return;
        this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: prevSaved } });
        this.saving.set(false);
      }
    });
  }

  onRegister(isPrivate: boolean): void {
  const courseId = this.courseId;
  if (!courseId) return;

  // Curso público → registro directo
  if (!isPrivate) {
    
    this.enrolling.set(true);
    this.feedbackSvc.enrollPublic(courseId).subscribe({
      next: () => {
        this.bridge.setRegistered(true);
        this.enrolling.set(false);
      },
      error: (err) => {
        this.codeError.set(err?.error?.message || 'No se pudo registrar.');
        this.enrolling.set(false);
      }
    });
    return;
  }

  // Curso privado → abrir diálogo de código
  this.codeError.set(null);
  this.clearOtp();
  this.dialogCodeShow = true;

  // Focus primera casilla al abrir el diálogo
  setTimeout(() => this.focusOtp(0), 50);
}


  // -----------------------------
  // HTML5 video events (archivo)
  // -----------------------------
  onVideoLoadedMetadata(video: HTMLVideoElement): void {
    const start = this.data()?.last_view?.second_seen || 0;
    try {
      if (start > 0 && video?.duration && start < video.duration) {
        video.currentTime = start;
      }
    } catch {}
  }

  onVideoTimeUpdate(video: HTMLVideoElement): void {
    const t = video.currentTime || 0;

    // Si hay salto grande (adelanto/retroceso), manda inmediato
    if (Math.abs(t - this.lastHtml5Time) > 1.5) {
      this.flushProgress(t);
    }

    this.progress$.next(t); // tick normal (throttling 4s)
    this.lastHtml5Time = t;
  }

  onVideoSeeked(video: HTMLVideoElement): void {
    const t = video.currentTime || 0;
    this.lastHtml5Time = t;  // sincroniza
    this.flushProgress(t);   // flush instantáneo
  }

  onVideoPause(video: HTMLVideoElement): void {
    this.flushProgress(video.currentTime);
  }

  onVideoEnded(video: HTMLVideoElement): void {
    const endSec = Number.isFinite(video.duration) ? video.duration : video.currentTime;
    this.flushProgress(endSec);
  }

  // -----------------------------
  // Envío de progreso (común)
  // -----------------------------
  private get learningContentId(): number | string | null {
    return this.data()?.learning_content?.id ?? null;
  }

  /** Encola el progreso (pasa por throttling de 4s) */
  private sendProgress(sec: number) {
    
    const lcId = this.learningContentId;
    if (lcId == null) return of(null);
    const s = Math.max(0, Math.floor(sec));
    if (s === this.lastSentSecond) return of(null); // evita duplicados
    this.lastSentSecond = s;
    
    // respaldo local por si el usuario recarga muy rápido
    this.saveResumeLocal(lcId, s);
    this.reportCompletedDelta(s);
    return this.feedbackSvc.setContent(lcId, s).pipe(
      catchError(() => of(null))
    );
  }

  /** Flush inmediato (pause/seek/end/ocultar/salir/navegar) */
  private flushProgress(currentSec: number) {
    const sec = Math.max(0, Math.floor(currentSec ?? 0));
    this.sendProgress(sec).subscribe();
  }

  /** Detecta player activo y hace flush inmediato */
  private flushNowFromCurrentPlayer(_isUnload = false) {
    if (this.isYouTube() && this.ytPlayer?.getCurrentTime) {
      const sec = this.ytPlayer.getCurrentTime();
      this.flushProgress(sec);
      return;
    }
    const videoEl = document.querySelector<HTMLVideoElement>('video.video-player');
    if (videoEl) this.flushProgress(videoEl.currentTime || 0);
  }

  // -----------------------------
  // YouTube IFrame API
  // -----------------------------
  private async initYouTubePlayerIfNeeded() {
    if (!this.isYouTube()) return;
    const iframe = this.ytFrame?.nativeElement;
    if (!iframe) return;

    await this.ensureYouTubeApi();
    this.destroyYouTubePlayer();

    this.ytPlayer = new window.YT.Player(iframe, {
      events: {
        onReady: (e: any) => {
          const start = this.data()?.last_view?.second_seen || 0;
          if (start > 0) {
            try { e.target.seekTo(start, true); } catch {}
          }
        },
        onStateChange: (e: any) => this.onYouTubeStateChange(e)
      }
    });
  }

  private onYouTubeStateChange(e: any) {
    const YT = window.YT;
    if (!YT || !this.ytPlayer) return;

    if (e.data === YT.PlayerState.PLAYING) {
      // Polling 1s → progress$ + detección de saltos
      this.ytTickStop$.next();
      interval(1000)
        .pipe(
          takeUntil(this.ytTickStop$),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const t = this.safeGetTimeFromYT();
          if (t == null) return;

          if (Math.abs(t - this.lastYtTime) > 1.5) {
            this.flushProgress(t);
          }

          this.progress$.next(t);
          this.lastYtTime = t;
        });
    } else if (e.data === YT.PlayerState.PAUSED) {
      this.ytTickStop$.next();
      const t = this.safeGetTimeFromYT();
      if (t != null) this.flushProgress(t);
    } else if (e.data === YT.PlayerState.BUFFERING) {
      // Suele ocurrir al hacer seek: flushea
      const t = this.safeGetTimeFromYT();
      if (t != null) this.flushProgress(t);
    } else if (e.data === YT.PlayerState.ENDED) {
      this.ytTickStop$.next();
      const t = this.safeGetDurationFromYT() ?? this.safeGetTimeFromYT() ?? 0;
      this.flushProgress(t);
    }
  }

  private destroyYouTubePlayer() {
    this.ytTickStop$.next();
    try { this.ytPlayer?.destroy?.(); } catch {}
    this.ytPlayer = null;
  }

  private safeGetTimeFromYT(): number | null {
    try {
      const t = this.ytPlayer?.getCurrentTime?.();
      return typeof t === 'number' && Number.isFinite(t) ? t : null;
    } catch { return null; }
  }
  private safeGetDurationFromYT(): number | null {
    try {
      const d = this.ytPlayer?.getDuration?.();
      return typeof d === 'number' && Number.isFinite(d) ? d : null;
    } catch { return null; }
  }

  /** Carga el IFrame API una sola vez */
  private ensureYouTubeApi(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (window.YT?.Player) { resolve(); return; }

      const existing = document.querySelector('script[data-youtube-api]');
      if (existing) {
        const check = () => window.YT?.Player ? resolve() : setTimeout(check, 50);
        check();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      tag.setAttribute('data-youtube-api', 'true');
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }

  // ---- YouTube helpers ----
  private buildYouTubeEmbed(rawUrl: string, startSec = 0): string | null {
    const id = this.extractYouTubeId(rawUrl);
    if (!id) return null;

    const origin = window.location.origin;
    const params = new URLSearchParams({
      autoplay: '0',
      modestbranding: '1',
      rel: '0',
      controls: '1',
      fs: '1',
      playsinline: '1',
      enablejsapi: '1',
      origin
    });
    if (startSec) params.set('start', String(Math.floor(startSec)));
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
  goToPortfolio(username: string) {
  this.router.navigate(['learning/portfolio', '@' + username]);
}

private getHtml5Duration(): number {
  const videoEl = document.querySelector<HTMLVideoElement>('video.video-player');
  const d = videoEl?.duration;
  return typeof d === 'number' && Number.isFinite(d) ? d : 0;
}

// private reportCompletedDelta(currentSec: number) {
//   const d = this.data(); 
//   if (!d) return;

//   const chapterId = d.chapter.id;

//   // Duración
//   let total = 0;
//   if (this.isYouTube()) total = this.safeGetDurationFromYT() ?? 0;
//   else total = this.getHtml5Duration();
//   if (!total || total <= 0) return;

//   // % actual y delta a reportar
//   const percent = Math.min(100, (currentSec / total) * 100);
//   const delta = Math.max(0, percent - this.lastPercentReported);
//   if (delta < this.minDeltaPercent) return;

//   this.lastPercentReported = percent;

//   // POST al backend (update progreso del contenido)
//   // this.bridge.markChapterCompleted(chapterId);
// }
/** Calcula y envía delta de progreso (%) a /feedback/progress/{learningContent}/update */
private reportCompletedDelta(currentSec: number) {
  const d = this.data();
  if (!d) return;

  const lcId = d.learning_content?.id;
  const chapterId = d.chapter.id;
  if (lcId == null) return;

  // 1) Duración total según player activo
  let total = 0;
  if (this.isYouTube()) total = this.safeGetDurationFromYT() ?? 0;
  else total = this.getHtml5Duration();

  if (!total || total <= 0) return; // aún no hay duración fiable

  // 2) Porcentaje actual y DELTA a reportar (incremental)
  const percent = Math.min(100, (currentSec / total) * 100);
  const delta = +(Math.max(0, percent - this.lastPercentReported).toFixed(2));
  if (delta < this.minDeltaPercent) return; // anti-spam (< 0.5%)

  // 3) Avanza el puntero local y envía al backend
  this.lastPercentReported = percent;

  this.feedbackSvc.updateProgress(lcId, { progress: delta }).subscribe({
    next: (res) => {
      // Opcional: si quieres reaccionar cuando el capítulo queda completado:
       if (res?.data?.chapter_completed) { 
          this.bridge.markChapterCompleted(chapterId);
        }
    },
    error: () => {
      // Silencioso: no interrumpimos la UX por un fallo puntual de red
    }
  });
}

private get courseId(): string | null {
  return this.route.parent?.snapshot.paramMap.get('id') ?? null;
}

private otpValue(): string {
  return this.otp().join('');
}

private clearOtp() {
  this.otp.set(Array.from({ length: this.otpLength }, () => ''));
}
private focusOtp(i: number) {
  const el = this.otpBoxes?.get(i)?.nativeElement;
  if (el) {
    el.focus();
    el.select?.();
  }
}

private allowedChar(c: string): boolean {
  // Mismo set que genera el backend: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (sin 0,O,1,I,L)
  return /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]$/.test(c);
}

onOtpInput(ev: Event, index: number) {
  const input = ev.target as HTMLInputElement;
  let v = (input.value || '').toUpperCase();

  // Si el usuario pega 2+ chars aquí, lo tratamos como paste:
  if (v.length > 1) {
    const data = v.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
    this.fillOtpFrom(0, data);
    if (this.otpValue().length === this.otpLength) this.submitOtp();
    return;
  }

  // Solo 1 char
  if (v && !this.allowedChar(v)) v = '';
  const arr = [...this.otp()];
  arr[index] = v;
  this.otp.set(arr);

  if (v && index < this.otpLength - 1) this.focusOtp(index + 1);
  if (this.otpValue().length === this.otpLength) this.submitOtp();
}

onOtpKeyDown(ev: KeyboardEvent, index: number) {
  const key = ev.key;
  if (key === 'Backspace') {
    ev.preventDefault();
    const arr = [...this.otp()];
    if (arr[index]) {
      arr[index] = '';
      this.otp.set(arr);
      return;
    }
    if (index > 0) {
      arr[index - 1] = '';
      this.otp.set(arr);
      this.focusOtp(index - 1);
    }
    return;
  }

  if (key === 'ArrowLeft' && index > 0) {
    ev.preventDefault();
    this.focusOtp(index - 1);
  }
  if (key === 'ArrowRight' && index < this.otpLength - 1) {
    ev.preventDefault();
    this.focusOtp(index + 1);
  }
  if (key === 'Enter' && this.otpValue().length === this.otpLength) {
    ev.preventDefault();
    this.submitOtp();
  }
}

onOtpPaste(ev: ClipboardEvent) {
  ev.preventDefault();
  const data = (ev.clipboardData?.getData('text') || '')
    .toUpperCase()
    .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
  if (!data) return;
  this.fillOtpFrom(0, data);
  if (this.otpValue().length === this.otpLength) this.submitOtp();
}

private fillOtpFrom(start: number, data: string) {
  const arr = [...this.otp()];
  let j = start;
  for (let i = 0; i < data.length && j < this.otpLength; i++, j++) {
    arr[j] = data[i];
  }
  this.otp.set(arr);
  const next = Math.min(start + data.length, this.otpLength - 1);
  this.focusOtp(next);
}

submitOtp() {
  const code = this.otpValue();
  if (code.length !== this.otpLength) return;
  this.enrolling.set(true);
  this.codeError.set(null);

  this.feedbackSvc.enrollPrivate(code).subscribe({
    next: () => {
      this.bridge.setRegistered(true);
      this.enrolling.set(false);
      this.dialogCodeShow = false;
      this.clearOtp();
    },
    error: (err) => {
      this.codeError.set(err?.error?.message || 'Código inválido o curso no disponible.');
      this.enrolling.set(false);
      // Selecciona todo para volver a intentar rápido
      this.focusOtp(0);
    }
  });
}

toTest() {
  this.router.navigate([ 'test'], { relativeTo: this.route.parent });

  }

}
