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
import { DialogComponent } from '../../../../../shared/UI/components/overlay/dialog/dialog.component';
import { TextComponent } from '../../../../../shared/UI/components/data/text/text.component';

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
import { NotificationBridgeService } from '../../../../../core/api/notification/notification-bridge.service';

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
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly watchingSvc        = inject(WatchingService);
  private readonly sanitizer          = inject(DomSanitizer);
  private readonly destroyRef         = inject(DestroyRef);
  private readonly feedbackSvc        = inject(FeedbackService);
  private readonly bridge             = inject(CourseBridge);
  private readonly notificationBridge = inject(NotificationBridgeService);

  @ViewChild('ytFrame')   ytFrame?:   ElementRef<HTMLIFrameElement>;
  @ViewChild('codeInput') codeInput?: ElementRef<HTMLInputElement>;

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly data     = signal<ContentResponse | null>(null);
  readonly liking   = signal(false);
  readonly saving   = signal(false);

  dialogCodeShow = false;
  dialogPdfShow  = false;
  dialogCloudShow = false;

  // ── YouTube embed (URL calculada una sola vez, no se recalcula en likes/saves) ──
  readonly ytEmbedRaw = signal<string | null>(null);
  readonly ytSafeSrc  = computed<SafeResourceUrl | null>(() => {
    const raw = this.ytEmbedRaw();
    return raw ? this.sanitizer.bypassSecurityTrustResourceUrl(raw) : null;
  });

  // PDF local (archive) para el visor en diálogo
  readonly pdfSafeSrc = computed<SafeResourceUrl | null>(() => {
    const d      = this.data();
    const format = (d?.learning_meta?.format || '').toLowerCase();
    const url    = d?.learning_content?.url;
    if (format !== 'pdf' || !url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // URL segura para el iframe de Google Drive / OneDrive
  readonly cloudSafeSrc = computed<SafeResourceUrl | null>(() => {
    if (!this.isCloudViewer() || this.isCloudZip()) return null;

    const d = this.data()?.learning_content;
    if (!d) return null;

    // Para embed válido preferimos url_insert que ya viene preparado para previews.
    const url = d.url_insert?.trim() || d.url?.trim();
    if (!url) return null;

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Helpers de tipo de contenido
  // ────────────────────────────────────────────────────────────────────────────

  /** type = 'link', format = 'youtube' */
  readonly isYouTube = computed(() => {
    const meta = this.data()?.learning_meta;
    return (
      (meta?.type   || '').toLowerCase() === 'link' &&
      (meta?.format || '').toLowerCase() === 'youtube'
    );
  });

  /** type = 'archive' */
  readonly isArchive = computed(() =>
    (this.data()?.learning_meta?.type || '').toLowerCase() === 'archive'
  );

  /** archive · format = 'video' */
  readonly isVideoFile = computed(() =>
    this.isArchive() &&
    (this.data()?.learning_meta?.format || '').toLowerCase() === 'video'
  );

  /** archive · format = 'audio' */
  readonly isAudio = computed(() =>
    this.isArchive() &&
    (this.data()?.learning_meta?.format || '').toLowerCase() === 'audio'
  );

  /** archive · format = 'pdf' */
  readonly isPdf = computed(() =>
    this.isArchive() &&
    (this.data()?.learning_meta?.format || '').toLowerCase() === 'pdf'
  );

  /** archive · format in [docx, pptx, xlsx, txt] */
  readonly isDocumentFile = computed(() =>
    this.isArchive() &&
    ['docx', 'pptx', 'xlsx', 'txt'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** archive · format in [compressed, zip, rar] */
  readonly isCompressedFile = computed(() =>
    this.isArchive() &&
    ['compressed', 'zip', 'rar'].includes(
      (this.data()?.learning_meta?.format || '').toLowerCase()
    )
  );

  /** archive · formato sin categoría conocida */
  readonly isRawFile = computed(() =>
    this.isArchive() &&
    !this.isVideoFile()    &&
    !this.isAudio()        &&
    !this.isPdf()          &&
    !this.isDocumentFile() &&
    !this.isCompressedFile()
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Cloud Viewers: Google Drive · OneDrive
  // ────────────────────────────────────────────────────────────────────────────

  /** type = 'link', format starts with 'googledrive.' */
  readonly isGoogleDrive = computed(() => {
    const meta = this.data()?.learning_meta;
    return (
      (meta?.type   || '').toLowerCase() === 'link' &&
      (meta?.format || '').toLowerCase().startsWith('googledrive.')
    );
  });

  /** type = 'link', format starts with 'onedrive.' */
  readonly isOneDrive = computed(() => {
    const meta = this.data()?.learning_meta;
    return (
      (meta?.type   || '').toLowerCase() === 'link' &&
      (meta?.format || '').toLowerCase().startsWith('onedrive.')
    );
  });

  /** true si el contenido usa un visor cloud (GD o OD) */
  readonly isCloudViewer = computed(() => this.isGoogleDrive() || this.isOneDrive());

  /**
   * Sub-formato tras el punto del nombre de formato.
   * Ej: 'googledrive.video' → 'video'  |  'onedrive.pdf' → 'pdf'
   */
  readonly linkSubFormat = computed<string>(() => {
    const fmt = (this.data()?.learning_meta?.format || '').toLowerCase();
    const dot = fmt.lastIndexOf('.');
    return dot !== -1 ? fmt.slice(dot + 1) : '';
  });

  /**
   * true cuando el cloud es media (video / audio).
   * En este caso el iframe ocupa todo el espacio sin cabecera de documento.
   */
  readonly isCloudMedia = computed(() =>
    this.isCloudViewer() && ['video', 'audio'].includes(this.linkSubFormat())
  );

  /**
   * true cuando el cloud es un archivo no-preview (zip/rar solo en modo enlace).
   * Usado para mantener comportamiento legacy.
   */
  readonly isCloudZip = computed(() =>
    this.isCloudViewer() && ['zip', 'rar'].includes(this.linkSubFormat())
  );

  /**
   * true cuando el cloud es compressed (previewable en diálogo).
   */
  readonly isCloudCompressed = computed(() =>
    this.isCloudViewer() && this.linkSubFormat() === 'compressed'
  );

  /**
   * true cuando el cloud es video.
   */
  readonly isCloudVideo = computed(() =>
    this.isCloudViewer() && this.linkSubFormat() === 'video'
  );

  /**
   * true cuando el cloud es audio.
   */
  readonly isCloudAudio = computed(() =>
    this.isCloudViewer() && this.linkSubFormat() === 'audio'
  );

  /**
   * true cuando el cloud es documento (pdf, docx, pptx, xlsx, txt, compressed).
   */
  readonly isCloudDocument = computed(() =>
    this.isCloudViewer() && ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'compressed'].includes(this.linkSubFormat())
  );

  /** Proveedor cloud activo */
  readonly cloudProvider = computed<'googledrive' | 'onedrive' | null>(() => {
    if (this.isGoogleDrive()) return 'googledrive';
    if (this.isOneDrive())    return 'onedrive';
    return null;
  });

  // ── Progreso en tiempo real ────────────────────────────────────────────────
  private progress$              = new Subject<number>();
  private lastSentSecond         = -1;
  private ytPlayer: any          = null;
  private ytTickStop$            = new Subject<void>();
  private lastHtml5Time          = 0;
  private lastYtTime             = 0;
  private lastPercentReported    = 0;
  private readonly minDeltaPercent = 0.5;
  private isPlayerActive         = false; // Flag: solo reportar progreso si hay reproducción activa
  private playerInitialized      = false; // Flag: player del tipo actual verificado

  // ── Registro / código de acceso ────────────────────────────────────────────
  readonly codeLength = 7;
  readonly code       = signal<string>('');
  readonly enrolling  = signal(false);
  readonly codeError  = signal<string | null>(null);

  isRegistered = computed(() => this.bridge.isRegistered());

  // ── Local backup de progreso ──────────────────────────────────────────────
  private resumeKey(lcId: number | string) { return `resume:${lcId}`; }

  private saveResumeLocal(lcId: number | string, sec: number): void {
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
        map((s) => Math.max(0, Math.floor(s))),
        distinctUntilChanged(),
        auditTime(4000),
        switchMap((sec) => this.sendProgress(sec)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // b) Cambio de capítulo reactivo (paramMap)
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

    // c) Primera carga por snapshot (evita espera del paramMap)
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

  // ── Carga y preparación de players ────────────────────────────────────────
  private setDataAndPreparePlayers(res: ContentResponse): void {
    // Reset de estado de progreso al cambiar de capítulo
    this.lastPercentReported = 0;
    this.lastHtml5Time       = 0;
    this.lastYtTime          = 0;
    this.lastSentSecond      = -1;
    this.isPlayerActive      = false; // Resetear: nunca reportar progreso al cambiar
    this.playerInitialized   = false;

    const lcId      = res?.learning_content?.id;
    const serverSec = res?.last_view?.second_seen ?? 0;

    // Preferir progreso local si es más reciente que el del servidor
    if (lcId != null) {
      const local = this.readResumeLocal(lcId);
      if (local && local.sec >= 0) {
        const serverUpdatedAt = res?.last_view?.updated_at
          ? new Date(res.last_view.updated_at).getTime()
          : 0;
        const useLocal = local.ts > serverUpdatedAt || local.sec > serverSec;

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

    // ── Inicializar player de FORMA ASINCRÓNICA ──
    // No bloqueamos el resto del componente esperando YouTube
    if (this.isYouTube()) {
      // Renderizar iframe de inmediato (sin esperar el script)
      // Inicializar el player SIN bloquear
      this.initYouTubePlayerIfNeeded().catch(() => {});
    } else {
      this.destroyYouTubePlayer();
    }
  }

  private updateYouTubeEmbedFromResponse(res: ContentResponse | null): void {
    const type   = (res?.learning_meta?.type   || '').toLowerCase();
    const format = (res?.learning_meta?.format || '').toLowerCase();

    if (res && type === 'link' && format === 'youtube' && res.learning_content?.url) {
      const start = res.last_view?.second_seen || 0;
      this.ytEmbedRaw.set(this.buildYouTubeEmbed(res.learning_content.url, start));
    } else {
      this.ytEmbedRaw.set(null);
    }
  }

  // ── Helpers de iconos y etiquetas ─────────────────────────────────────────

  /** Ícono SVG para formatos de archivo (archive y sub-formatos cloud) */
  getFileIcon(format: string): string {
    const icons: Record<string, string> = {
      video: 'svg/video-color.svg',
      audio: 'svg/audio-color.svg',
      pdf:   'svg/pdf-color.svg',
      docx:  'svg/word-color.svg',
      pptx:  'svg/powerpoint-color.svg',
      xlsx:  'svg/excel-color.svg',
      compressed: 'svg/zip-color.svg',
      zip: 'svg/zip-color.svg',
      rar: 'svg/zip-color.svg',
      txt:   'svg/text-color.svg',
    };
    return icons[(format || '').toLowerCase()] ?? 'svg/file.svg';
  }

  /** Alias semántico para iconos de sub-formatos cloud */
  getCloudSubFormatIcon(subFormat: string): string {
    return this.getFileIcon(subFormat);
  }

  /** Etiqueta legible del proveedor cloud */
  getCloudProviderLabel(provider: 'googledrive' | 'onedrive' | null): string {
    if (provider === 'googledrive') return 'Google Drive';
    if (provider === 'onedrive')    return 'OneDrive';
    return 'Nube';
  }

  /** Ícono del proveedor cloud */
  getCloudProviderIcon(provider: 'googledrive' | 'onedrive' | null): string {
    if (provider === 'googledrive') return 'svg/googledrive-color.svg';
    if (provider === 'onedrive')    return 'svg/onedrive-color.svg';
    return 'svg/cloud.svg'; // fallback
  }

  // ── UI Actions (optimistic updates) ───────────────────────────────────────
  toggleLike(): void {
    const d = this.data();
    if (!d) return;

    const chapterId = d.chapter.id;
    const prevLiked = d.user_state.liked_chapter;
    const nextLiked = !prevLiked;
    const prevLikes = d.likes_total ?? 0;

    // Actualización optimista
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
        // Revertir en caso de error
        const cur = this.data();
        if (!cur) return;
        this.data.set({
          ...cur,
          user_state:  { ...cur.user_state, liked_chapter: prevLiked },
          likes_total: prevLikes
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
    this.playerInitialized = true; // Metadata cargado, pero NO activo aún
    this.isPlayerActive = false; // Esperar a que el usuario presione play
  }

  onVideoPlay(video: HTMLVideoElement): void {
    this.isPlayerActive = true; // Usuario presionó play
  }

  onVideoTimeUpdate(video: HTMLVideoElement): void {
    // Solo reportar si: (1) metadata cargó, (2) está reproduciéndose activamente
    if (!this.playerInitialized || !this.isPlayerActive) return;

    const t = video.currentTime || 0;
    if (Math.abs(t - this.lastHtml5Time) > 1.5) this.flushProgress(t);
    this.progress$.next(t);
    this.lastHtml5Time = t;
  }

  onVideoSeeked(video: HTMLVideoElement): void {
    if (!this.playerInitialized) return;
    const t = video.currentTime || 0;
    this.lastHtml5Time = t;
    // Solo flush si está activo, de lo contrario es solo un seek preparatorio
    if (this.isPlayerActive) this.flushProgress(t);
  }

  onVideoPause(video: HTMLVideoElement): void { 
    this.isPlayerActive = false;
    this.flushProgress(video.currentTime); 
  }

  onVideoEnded(video: HTMLVideoElement): void {
    const endSec = Number.isFinite(video.duration) ? video.duration : video.currentTime;
    this.flushProgress(endSec);
  }

  // ── HTML5 <audio> events ───────────────────────────────────────────────────
  onAudioLoadedMetadata(audio: HTMLAudioElement): void {
    const start = this.data()?.last_view?.second_seen || 0;
    try {
      if (start > 0 && audio?.duration && start < audio.duration) {
        audio.currentTime = start;
      }
    } catch {}
    this.playerInitialized = true; // Metadata cargado, pero NO activo aún
    this.isPlayerActive = false; // Esperar a que el usuario presione play
  }

  onAudioPlay(audio: HTMLAudioElement): void {
    this.isPlayerActive = true; // Usuario presionó play
  }

  onAudioTimeUpdate(audio: HTMLAudioElement): void {
    // Solo reportar si: (1) metadata cargó, (2) está reproduciéndose activamente
    if (!this.playerInitialized || !this.isPlayerActive) return;

    const t = audio.currentTime || 0;
    if (Math.abs(t - this.lastHtml5Time) > 1.5) this.flushProgress(t);
    this.progress$.next(t);
    this.lastHtml5Time = t;
  }

  onAudioSeeked(audio: HTMLAudioElement): void {
    if (!this.playerInitialized) return;
    const t = audio.currentTime || 0;
    this.lastHtml5Time = t;
    // Solo flush si está activo, de lo contrario es solo un seek preparatorio
    if (this.isPlayerActive) this.flushProgress(t);
  }

  onAudioPause(audio: HTMLAudioElement): void { 
    this.isPlayerActive = false;
    this.flushProgress(audio.currentTime); 
  }

  onAudioEnded(audio: HTMLAudioElement): void {
    const endSec = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime;
    this.flushProgress(endSec);
  }

  // ── Cloud iframe events ────────────────────────────────────────────────────

  /**
   * Callback al cargar el iframe de Google Drive / OneDrive.
   * Para media cloud, marcar como completado ya que no podemos rastrear tiempo.
   */
  onCloudIframeLoaded(): void {
    if (this.isCloudMedia()) {
      this.markNonTimeContentCompleted();
    }
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

  private flushProgress(currentSec: number): void {
    const sec = Math.max(0, Math.floor(currentSec ?? 0));
    this.sendProgress(sec).subscribe();
  }

  /**
   * Detecta el player activo y hace flush del progreso actual.
   * Los cloud viewers (cross-origin) se saltan ya que no podemos
   * leer su posición de reproducción.
   */
  private flushNowFromCurrentPlayer(_isUnload = false): void {
    if (this.isYouTube() && this.ytPlayer?.getCurrentTime) {
      this.flushProgress(this.ytPlayer.getCurrentTime());
      return;
    }
    if (this.isCloudViewer()) return; // iframe cross-origin: sin acceso

    const videoEl = document.querySelector<HTMLVideoElement>('video.video-player');
    if (videoEl) { this.flushProgress(videoEl.currentTime || 0); return; }

    const audioEl = document.querySelector<HTMLAudioElement>('audio.audio-player');
    if (audioEl) this.flushProgress(audioEl.currentTime || 0);
  }

  // ── YouTube IFrame API ────────────────────────────────────────────────────
  private async initYouTubePlayerIfNeeded(): Promise<void> {
    if (!this.isYouTube()) return;
    const iframe = this.ytFrame?.nativeElement;
    if (!iframe) return;

    try {
      await this.ensureYouTubeApi();
      this.destroyYouTubePlayer();

      this.ytPlayer = new window.YT.Player(iframe, {
        events: {
          onReady: (e: any) => {
            this.playerInitialized = true;
            const start = this.data()?.last_view?.second_seen || 0;
            if (start > 0) { try { e.target.seekTo(start, true); } catch {} }
          },
          onStateChange: (e: any) => this.onYouTubeStateChange(e)
        }
      });
    } catch (err) {
      console.error('Error initializing YouTube player:', err);
    }
  }

  private onYouTubeStateChange(e: any): void {
    const YT = window.YT;
    if (!YT || !this.ytPlayer) return;

    if (e.data === YT.PlayerState.PLAYING) {
      this.isPlayerActive = true; // Usuario presionó play
      this.playerInitialized = true;
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
      this.isPlayerActive = false; // Usuario pausó
      this.ytTickStop$.next();
      const t = this.safeGetTimeFromYT();
      if (t != null) this.flushProgress(t);
    } else if (e.data === YT.PlayerState.BUFFERING) {
      // BUFFERING ocurre justo después de READY, NO reportar
      // Solo reportar si ya está activo
      if (this.isPlayerActive) {
        const t = this.safeGetTimeFromYT();
        if (t != null) this.flushProgress(t);
      }
    } else if (e.data === YT.PlayerState.ENDED) {
      this.isPlayerActive = false;
      this.ytTickStop$.next();
      const t = this.safeGetDurationFromYT() ?? this.safeGetTimeFromYT() ?? 0;
      this.flushProgress(t);
    } else if (e.data === YT.PlayerState.UNSTARTED) {
      this.isPlayerActive = false; // Fue pausado
      this.playerInitialized = true;
    }
  }

  private destroyYouTubePlayer(): void {
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
    return new Promise<void>((resolve, reject) => {
      // Ya existe, resolución inmediata
      if (window.YT?.Player) { resolve(); return; }

      const existing = document.querySelector('script[data-youtube-api]') as HTMLScriptElement | null;
      if (existing) {
        // Script en proceso de carga, esperar con timeout
        const timeoutMs = 10000; // 10s max
        const startTime = Date.now();
        const check = () => {
          if (window.YT?.Player) { resolve(); return; }
          if (Date.now() - startTime > timeoutMs) { 
            reject(new Error('YouTube API timeout')); 
            return; 
          }
          setTimeout(check, 100); // Aumentar intervalo a 100ms para mejor performance
        };
        check();
        return;
      }

      // Crear nuevo script
      const tag = document.createElement('script');
      tag.src   = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.defer = true;
      tag.setAttribute('data-youtube-api', 'true');
      
      // Timeout de 10s para fallback
      const timer = setTimeout(() => reject(new Error('YouTube API load timeout')), 10000);

      tag.onload = () => {
        clearTimeout(timer);
        // Dar tiempo extra para que onYouTubeIframeAPIReady se defina
        const checkApi = setInterval(() => {
          if (window.YT?.Player) {
            clearInterval(checkApi);
            resolve();
          }
        }, 50);
      };

      tag.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Failed to load YouTube API'));
      };

      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => { 
        clearTimeout(timer);
        resolve(); 
      };
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
      if (u.searchParams.get('v'))          return u.searchParams.get('v');
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
  private reportCompletedDelta(currentSec: number): void {
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
  ): void {
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

  /**
   * Marca contenido sin dimensión temporal como 100 % completado.
   * Usado por: PDF, documentos de oficina, archivos comprimidos, cloud viewers.
   */
  private markNonTimeContentCompleted(): void {
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
  private focusCodeInput(): void {
    const el = this.codeInput?.nativeElement;
    if (el) { el.focus(); el.select?.(); }
  }

  onCodeInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    let value   = (input.value || '').toUpperCase();
    value       = value.replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, '');
    if (value.length > this.codeLength) value = value.slice(0, this.codeLength);
    this.code.set(value);
    if (input.value !== value) input.value = value;
  }

  submitCode(): void {
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

  // ── Acciones de documentos y archivos ─────────────────────────────────────

  openPdfViewer(): void {
    this.markNonTimeContentCompleted();
    this.dialogPdfShow = true;
  }

  /** Abre el visor de documentos cloud en diálogo */
  openCloudDocumentViewer(): void {
    this.markNonTimeContentCompleted();
    this.dialogCloudShow = true;
  }

  /** Descarga un archivo archive (pdf, docx, zip, etc.) */
  downloadFile(url: string): void {
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

  /** Abre un enlace cloud en nueva pestaña (usado para ZIP de GD/OD) */
  openCloudLink(url: string): void {
    if (!url) return;
    this.markNonTimeContentCompleted();
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
  }

  goToPortfolio(username: string): void {
    this.router.navigate(['learning/portfolio', '@' + username]);
  }

  toTest(): void {
    this.router.navigate(['test'], { relativeTo: this.route.parent });
  }
}