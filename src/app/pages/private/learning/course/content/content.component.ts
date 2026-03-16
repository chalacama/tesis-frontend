import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  ViewChild,
  ElementRef
} from '@angular/core';
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
  takeUntil,
  tap
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';
import { LikeResponse, SavedResponse } from '../../../../../core/api/feedback/feedback.interface';
import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';
import { DialogComponent } from '../../../../../shared/UI/components/overlay/dialog/dialog.component';

import { NotificationBridgeService } from '../../../../../core/api/notification/notification-bridge.service';

import { TextComponent } from '../../../../../shared/UI/components/data/text/text.component';

declare global {
  interface Window { onYouTubeIframeAPIReady?: () => void; YT?: any; }
}

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    ButtonComponent,
    AvatarComponent,
    DialogComponent,
    TextComponent
  ],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly watchingSvc    = inject(WatchingService);
  private readonly sanitizer      = inject(DomSanitizer);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly feedbackSvc    = inject(FeedbackService);
  private readonly bridge         = inject(CourseBridge);
  private readonly notificationBridge = inject(NotificationBridgeService);

  @ViewChild('ytFrame')   ytFrame?:   ElementRef<HTMLIFrameElement>;
  @ViewChild('codeInput') codeInput?: ElementRef<HTMLInputElement>;

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loading   = signal(true);
  readonly error     = signal<string | null>(null);
  readonly data      = signal<ContentResponse | null>(null);
  readonly liking    = signal(false);
  readonly saving    = signal(false);

  dialogCodeShow = false;
  dialogPdfShow  = false;

  // ── YouTube embed (no re-render en likes/saves) ────────────────────────────
  readonly ytEmbedRaw = signal<string | null>(null);
  readonly ytSafeSrc  = computed<SafeResourceUrl | null>(() => {
    const raw = this.ytEmbedRaw();
    return raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  });

  readonly pdfSafeSrc = computed<SafeResourceUrl | null>(() => {
    const d      = this.data();
    const format = (d?.learning_meta?.format || '').toLowerCase();
    const url    = d?.learning_content?.url;
    if (format !== 'pdf' || !url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ── Helpers de tipo de contenido ──────────────────────────────────────────
  /**
   * CAMBIO: el type del TypeLearningContent es ahora "link"
   * y el format del Format es "youtube".
   */
  readonly isYouTube = computed(() => {
    const meta = this.data()?.learning_meta;
    return (
      (meta?.type   || '').toLowerCase() === 'link' &&
      (meta?.format || '').toLowerCase() === 'youtube'
    );
  });

  /**
   * CAMBIO: el name del TypeLearningContent es ahora "archive" (normalizado).
   * Se eliminan los alias legacy "archivo" / "file".
   */
  readonly isArchive = computed(() =>
    (this.data()?.learning_meta?.type || '').toLowerCase() === 'archive'
  );

  readonly isVideoFile = computed(() =>
    this.isArchive() &&
    ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** NUEVO: audio MP3 */
  readonly isAudio = computed(() =>
    this.isArchive() &&
    (this.data()?.learning_meta?.format || '').toLowerCase() === 'mp3'
  );

  readonly isPdf = computed(() =>
    this.isArchive() &&
    (this.data()?.learning_meta?.format || '').toLowerCase() === 'pdf'
  );

  readonly isImageFile = computed(() =>
    this.isArchive() &&
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** NUEVO: documentos de oficina + texto plano */
  readonly isDocumentFile = computed(() =>
    this.isArchive() &&
    ['docx', 'pptx', 'xlsx', 'txt'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** NUEVO: archivos comprimidos */
  readonly isCompressedFile = computed(() =>
    this.isArchive() &&
    ['zip', 'rar'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** Cualquier otro formato no clasificado */
  readonly isRawFile = computed(() =>
    this.isArchive() &&
    !this.isVideoFile()    &&
    !this.isAudio()        &&
    !this.isPdf()          &&
    !this.isImageFile()    &&
    !this.isDocumentFile() &&
    !this.isCompressedFile()
  );

  // ── Progreso en tiempo real ────────────────────────────────────────────────
  private progress$          = new Subject<number>();
  private lastSentSecond     = -1;
  private ytPlayer: any      = null;
  private ytTickStop$        = new Subject<void>();

  private lastHtml5Time      = 0;
  private lastYtTime         = 0;

  private lastPercentReported  = 0;
  private readonly minDeltaPercent = 0.5;

  // ── Registro ──────────────────────────────────────────────────────────────
  readonly codeLength = 7;
  readonly code       = signal<string>('');
  readonly enrolling  = signal(false);
  readonly codeError  = signal<string | null>(null);

  isRegistered = computed(() => this.bridge.isRegistered());

  // ── Local backup ──────────────────────────────────────────────────────────
  private resumeKey(lcId: number | string) { return `resume:${lcId}`; }

  private saveResumeLocal(lcId: number | string, sec: number) {
    try {
      localStorage.setItem(
        this.resumeKey(lcId),
        JSON.stringify({ sec: Math.floor(sec), ts: Date.now() })
      );
    } catch {}
  }

  private readResumeLocal(lcId: number | string): { sec: number; ts: number } | null {
    try {
      const raw = localStorage.getItem(this.resumeKey(lcId));
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (typeof v?.sec === 'number' && typeof v?.ts === 'number') return v;
    } catch {}
    return null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // a) Canal de progreso con throttling 4 s
    this.progress$
      .pipe(
        map((s)  => Math.max(0, Math.floor(s))),
        distinctUntilChanged(),
        auditTime(4000),
        switchMap((sec) => this.sendProgress(sec)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // b) Cambio de capítulo por paramMap
    const parent = this.route.parent ?? this.route;

    parent.paramMap
      .pipe(
        map((pm) => pm.get('chapterId')),
        filter((id): id is string => !!id),
        distinctUntilChanged(),
        tap(() => { this.loading.set(true); this.error.set(null); }),
        switchMap((chapterId) =>
          this.watchingSvc.getChapterContent(chapterId).pipe(
            catchError((err) => {
              this.error.set(err?.error?.message || 'No se pudo cargar el contenido.');
              return of(null);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) this.setDataAndPreparePlayers(res);
        this.loading.set(false);
      });

    // c) Primera carga por snapshot
    const initialId = parent.snapshot.paramMap.get('chapterId');
    if (initialId) {
      this.loading.set(true);
      this.watchingSvc.getChapterContent(initialId).subscribe({
        next: (res) => { this.setDataAndPreparePlayers(res); this.loading.set(false); },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo cargar el contenido.');
          this.loading.set(false);
        }
      });
    }

    // d) Flush al ocultar pestaña / cerrar / navegar
    const onVisibility   = () => this.flushNowFromCurrentPlayer();
    const onBeforeUnload = () => this.flushNowFromCurrentPlayer(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    this.router.events
      .pipe(
        filter((ev) => ev instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.flushNowFromCurrentPlayer());

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      this.destroyYouTubePlayer();
    });
  }

  // ── Carga / prepare players ───────────────────────────────────────────────
  private setDataAndPreparePlayers(res: ContentResponse) {
    this.lastPercentReported = 0;
    this.lastHtml5Time       = 0;
    this.lastYtTime          = 0;
    this.lastSentSecond      = -1;

    const lcId      = res?.learning_content?.id;
    const serverSec = res?.last_view?.second_seen ?? 0;

    if (lcId != null) {
      const local = this.readResumeLocal(lcId);
      if (local && local.sec >= 0) {
        const useLocal =
          local.ts > (res?.last_view?.updated_at
            ? new Date(res.last_view.updated_at).getTime()
            : 0) || local.sec > serverSec;

        if (useLocal) {
          res = {
            ...res,
            last_view: {
              ...res.last_view,
              second_seen: local.sec,
              updated_at:  new Date(local.ts).toISOString()
            } as any
          };
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

  private updateYouTubeEmbedFromResponse(res: ContentResponse | null): void {
    const type   = (res?.learning_meta?.type   || '').toLowerCase();
    const format = (res?.learning_meta?.format || '').toLowerCase();

    if (res && type === 'link' && format === 'youtube' && res.learning_content?.url) {
      const start = res.last_view?.second_seen || 0;
      const embed = this.buildYouTubeEmbed(res.learning_content.url, start);
      this.ytEmbedRaw.set(embed);
    } else {
      this.ytEmbedRaw.set(null);
    }
  }

  // ── Ícono según formato ────────────────────────────────────────────────────
  getFileIcon(format: string): string {
    const icons: Record<string, string> = {
      pdf:  'svg/pdf-color.svg',
      docx: 'svg/word-color.svg',
      pptx: 'svg/powerpoint-color.svg',
      xlsx: 'svg/excel-color.svg',
      zip:  'svg/zip-color.svg',
      rar:  'svg/rar-color.svg',
      txt:  'svg/text-color.svg',
      // mp3:  'svg/audio-color.svg',
      // mp4:  'svg/video-color.svg',
      // jpg:  'svg/image-color.svg',
      // jpeg: 'svg/image-color.svg',
      // png:  'svg/image-color.svg',
      // gif:  'svg/image-color.svg',
      // webp: 'svg/image-color.svg',
    };
    return icons[(format || '').toLowerCase()] ?? 'svg/file-color.svg';
  }

  // ── UI Actions (optimistic) ────────────────────────────────────────────────
  toggleLike(): void {
    const d = this.data();
    if (!d) return;

    const chapterId = d.chapter.id;
    const prevLiked = d.user_state.liked_chapter;
    const nextLiked = !prevLiked;
    const prevLikes = d.likes_total ?? 0;

    this.data.set({
      ...d,
      user_state:  { ...d.user_state, liked_chapter: nextLiked },
      likes_total: nextLiked ? prevLikes + 1 : Math.max(0, prevLikes - 1)
    });

    this.liking.set(true);
    this.feedbackSvc.setLiked(chapterId, nextLiked).subscribe({
      next: (res: LikeResponse) => {
        const cur = this.data();
        if (!cur) return;
        if (res.liked !== cur.user_state.liked_chapter) {
          const likes = cur.likes_total ?? 0;
          this.data.set({
            ...cur,
            user_state:  { ...cur.user_state, liked_chapter: res.liked },
            likes_total: res.liked ? likes + 1 : Math.max(0, likes - 1)
          });
        }
        this.liking.set(false);
      },
      error: () => {
        const cur = this.data();
        if (!cur) return;
        this.data.set({
          ...cur,
          user_state:  { ...cur.user_state, liked_chapter: prevLiked },
          likes_total: prevLiked ? prevLikes : Math.max(0, prevLikes)
        });
        this.liking.set(false);
      }
    });
  }

  toggleSaved(): void {
    const d = this.data();
    if (!d) return;

    const routeCourseId = this.route.parent?.snapshot.paramMap.get('id');
    if (!routeCourseId) return;

    const prevSaved = d.user_state.is_saved;
    const nextSaved = !prevSaved;

    this.data.set({ ...d, user_state: { ...d.user_state, is_saved: nextSaved } });

    this.saving.set(true);
    this.feedbackSvc.setSaved(routeCourseId, nextSaved).subscribe({
      next: (res: SavedResponse) => {
        const cur = this.data();
        if (!cur) return;
        if (res.saved !== cur.user_state.is_saved) {
          this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: res.saved } });
        }
        this.saving.set(false);
      },
      error: () => {
        const cur = this.data();
        if (!cur) return;
        this.data.set({ ...cur, user_state: { ...cur.user_state, is_saved: prevSaved } });
        this.saving.set(false);
      }
    });
  }

  onRegister(isPrivate: boolean): void {
    const courseId = this.courseId;
    if (!courseId) return;

    if (!isPrivate) {
      this.enrolling.set(true);
      this.feedbackSvc.enrollPublic(courseId).subscribe({
        next: () => { this.bridge.setRegistered(true); this.enrolling.set(false); },
        error: (err) => {
          this.codeError.set(err?.error?.message || 'No se pudo registrar.');
          this.enrolling.set(false);
        }
      });
      return;
    }

    this.codeError.set(null);
    this.code.set('');
    this.dialogCodeShow = true;
    setTimeout(() => this.focusCodeInput(), 50);
  }

  // ── HTML5 <video> events ───────────────────────────────────────────────────
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
    if (Math.abs(t - this.lastHtml5Time) > 1.5) this.flushProgress(t);
    this.progress$.next(t);
    this.lastHtml5Time = t;
  }

  onVideoSeeked(video: HTMLVideoElement): void {
    const t = video.currentTime || 0;
    this.lastHtml5Time = t;
    this.flushProgress(t);
  }

  onVideoPause(video: HTMLVideoElement): void { this.flushProgress(video.currentTime); }

  onVideoEnded(video: HTMLVideoElement): void {
    const endSec = Number.isFinite(video.duration) ? video.duration : video.currentTime;
    this.flushProgress(endSec);
  }

  // ── HTML5 <audio> events (MP3) ─────────────────────────────────────────────
  onAudioLoadedMetadata(audio: HTMLAudioElement): void {
    const start = this.data()?.last_view?.second_seen || 0;
    try {
      if (start > 0 && audio?.duration && start < audio.duration) {
        audio.currentTime = start;
      }
    } catch {}
  }

  onAudioTimeUpdate(audio: HTMLAudioElement): void {
    const t = audio.currentTime || 0;
    if (Math.abs(t - this.lastHtml5Time) > 1.5) this.flushProgress(t);
    this.progress$.next(t);
    this.lastHtml5Time = t;
  }

  onAudioSeeked(audio: HTMLAudioElement): void {
    const t = audio.currentTime || 0;
    this.lastHtml5Time = t;
    this.flushProgress(t);
  }

  onAudioPause(audio: HTMLAudioElement): void { this.flushProgress(audio.currentTime); }

  onAudioEnded(audio: HTMLAudioElement): void {
    const endSec = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime;
    this.flushProgress(endSec);
  }

  // ── Envío de progreso ─────────────────────────────────────────────────────
  private get learningContentId(): number | string | null {
    return this.data()?.learning_content?.id ?? null;
  }

  private sendProgress(sec: number) {
    const lcId = this.learningContentId;
    if (lcId == null) return of(null);

    const s = Math.max(0, Math.floor(sec));
    if (s === this.lastSentSecond) return of(null);
    this.lastSentSecond = s;

    this.saveResumeLocal(lcId, s);
    this.reportCompletedDelta(s);

    return this.feedbackSvc.setContent(lcId, s).pipe(catchError(() => of(null)));
  }

  private flushProgress(currentSec: number) {
    const sec = Math.max(0, Math.floor(currentSec ?? 0));
    this.sendProgress(sec).subscribe();
  }

  /** Detecta el player activo (YouTube → video → audio) y hace flush */
  private flushNowFromCurrentPlayer(_isUnload = false) {
    if (this.isYouTube() && this.ytPlayer?.getCurrentTime) {
      this.flushProgress(this.ytPlayer.getCurrentTime());
      return;
    }
    const videoEl = document.querySelector<HTMLVideoElement>('video.video-player');
    if (videoEl) { this.flushProgress(videoEl.currentTime || 0); return; }

    const audioEl = document.querySelector<HTMLAudioElement>('audio.audio-player');
    if (audioEl) this.flushProgress(audioEl.currentTime || 0);
  }

  // ── YouTube IFrame API ────────────────────────────────────────────────────
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
          if (start > 0) { try { e.target.seekTo(start, true); } catch {} }
        },
        onStateChange: (e: any) => this.onYouTubeStateChange(e)
      }
    });
  }

  private onYouTubeStateChange(e: any) {
    const YT = window.YT;
    if (!YT || !this.ytPlayer) return;

    if (e.data === YT.PlayerState.PLAYING) {
      this.ytTickStop$.next();
      interval(1000)
        .pipe(takeUntil(this.ytTickStop$), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const t = this.safeGetTimeFromYT();
          if (t == null) return;
          if (Math.abs(t - this.lastYtTime) > 1.5) this.flushProgress(t);
          this.progress$.next(t);
          this.lastYtTime = t;
        });
    } else if (e.data === YT.PlayerState.PAUSED) {
      this.ytTickStop$.next();
      const t = this.safeGetTimeFromYT();
      if (t != null) this.flushProgress(t);
    } else if (e.data === YT.PlayerState.BUFFERING) {
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

  private ensureYouTubeApi(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (window.YT?.Player) { resolve(); return; }

      const existing = document.querySelector('script[data-youtube-api]') as HTMLScriptElement | null;
      if (existing) {
        const check = () => window.YT?.Player ? resolve() : setTimeout(check, 50);
        check();
        return;
      }

      const tag = document.createElement('script');
      tag.src   = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      tag.setAttribute('data-youtube-api', 'true');
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => resolve();
    });
  }

  private buildYouTubeEmbed(rawUrl: string, startSec = 0): string | null {
    const id = this.extractYouTubeId(rawUrl);
    if (!id) return null;

    const origin = window.location.origin;
    const params = new URLSearchParams({
      autoplay: '0', modestbranding: '1', rel: '0',
      controls: '1', fs: '1', playsinline: '1', enablejsapi: '1', origin
    });
    if (startSec) params.set('start', String(Math.floor(startSec)));
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }

  private extractYouTubeId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null;
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const path = u.pathname.split('/');
      const i    = path.indexOf('embed');
      return i !== -1 && path[i + 1] ? path[i + 1] : null;
    } catch {
      const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return m?.[1] || null;
    }
  }

  // ── Duración del player HTML5 activo (video o audio) ──────────────────────
  private getHtml5Duration(): number {
    const videoEl = document.querySelector<HTMLVideoElement>('video.video-player');
    const audioEl = document.querySelector<HTMLAudioElement>('audio.audio-player');
    const el      = videoEl ?? audioEl;
    const d       = el?.duration;
    return typeof d === 'number' && Number.isFinite(d) ? d : 0;
  }

  // ── Delta de progreso (%) ─────────────────────────────────────────────────
  private reportCompletedDelta(currentSec: number) {
    const d = this.data();
    if (!d) return;

    const lcId      = d.learning_content?.id;
    const chapterId = d.chapter.id;
    if (lcId == null) return;

    let total = 0;
    if (this.isYouTube()) total = this.safeGetDurationFromYT() ?? 0;
    else                  total = this.getHtml5Duration();

    if (!total || total <= 0) return;

    const percent = Math.min(100, (currentSec / total) * 100);
    const delta   = +Math.max(0, percent - this.lastPercentReported).toFixed(2);
    if (delta < this.minDeltaPercent) return;

    this.sendProgressDelta(lcId, chapterId, delta, percent);
  }

  private sendProgressDelta(
    lcId: number | string,
    chapterId: number,
    delta: number,
    newPercent: number
  ) {
    if (delta <= 0) return;
    this.lastPercentReported = newPercent;

    this.feedbackSvc.updateProgress(lcId, { progress: delta }).subscribe({
      next: (res) => {
        if (res?.data?.chapter_completed) {
          this.bridge.markChapterCompleted(chapterId);
        }
        if (res?.data?.certificate_issued) {
          this.notificationBridge.increment(1);
          this.bridge.notifyCertificateIssued();
        }
      },
      error: () => {}
    });
  }

  /** Marca como 100 % completado contenido sin duración (PDF, imagen, doc, etc.) */
  private markNonTimeContentCompleted() {
    const d = this.data();
    if (!d) return;

    const lcId      = d.learning_content?.id;
    const chapterId = d.chapter.id;
    if (lcId == null) return;

    this.feedbackSvc.setContent(lcId, 1).pipe(catchError(() => of(null))).subscribe();

    const delta = +Math.max(0, 100 - this.lastPercentReported).toFixed(2);
    if (delta <= 0) return;
    this.sendProgressDelta(lcId, chapterId, delta, 100);
  }

  private get courseId(): string | null {
    return this.route.parent?.snapshot.paramMap.get('id') ?? null;
  }

  // ── Código de acceso ──────────────────────────────────────────────────────
  private focusCodeInput() {
    const el = this.codeInput?.nativeElement;
    if (el) { el.focus(); el.select?.(); }
  }

  onCodeInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    let value   = (input.value || '').toUpperCase();
    value = value.replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
    if (value.length > this.codeLength) value = value.slice(0, this.codeLength);
    this.code.set(value);
    if (input.value !== value) input.value = value;
  }

  submitCode() {
    const code = this.code();
    if (code.length !== this.codeLength) return;

    this.enrolling.set(true);
    this.codeError.set(null);

    this.feedbackSvc.enrollPrivate(code).subscribe({
      next: () => {
        this.bridge.setRegistered(true);
        this.enrolling.set(false);
        this.dialogCodeShow = false;
        this.code.set('');
      },
      error: (err) => {
        this.codeError.set(err?.error?.message || 'Código inválido o curso no disponible.');
        this.enrolling.set(false);
        this.focusCodeInput();
      }
    });
  }

  // ── Acciones de documentos / archivos ─────────────────────────────────────
  openPdfViewer() {
    this.markNonTimeContentCompleted();
    this.dialogPdfShow = true;
  }

  downloadFile(url: string) {
    if (!url) return;
    this.markNonTimeContentCompleted();
    try {
      const link    = document.createElement('a');
      link.href     = url;
      link.target   = '_blank';
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
  }

  onImageLoaded() { this.markNonTimeContentCompleted(); }

  goToPortfolio(username: string) {
    this.router.navigate(['learning/portfolio', '@' + username]);
  }

  toTest() {
    this.router.navigate(['test'], { relativeTo: this.route.parent });
  }
}