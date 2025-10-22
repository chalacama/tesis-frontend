import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  AfterViewInit,
  computed,
  inject,
  signal,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AvatarComponent } from '../../../../../shared/UI/components/media/avatar/avatar.component';
import { IconComponent } from '../../../../../shared/UI/components/button/icon/icon.component';

import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';
import { WatchingService } from '../../../../../core/api/watching/watching.service';
import {
  CommentResponse,
  RepliesResponse,
  Datum,
  OwnerSummary,
  PaginationParams
} from '../../../../../core/api/watching/comment.interface';
import { AuthService } from '../../../../../core/api/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AutosizeDirective } from '../../../../../shared/directives/autosize.directive';
import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';

type ReplyState = {
  items: Datum[];
  page: number;
  hasMore: boolean;
  open: boolean;
  loading: boolean;

  // Composer para responder al COMENTARIO (nivel 1)
  composerOpen: boolean;
  draft: string;

  // Composer para responder a una RESPUESTA (nivel 2)
  childOpen: boolean;
  childDraft: string;
  childTargetId: number | null;

  // @mention fuera del textarea (no se envía)
  childMention?: string | null;   // ej. "@bautista69"
  childTarget?: Datum | null;     // la respuesta objetivo
};

type MeUser = {
  id: number;
  username: string;
  name: string;
  lastname: string;
  profile_picture_url?: string | null;
};

@Component({
  selector: 'app-comment',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, IconComponent, AutosizeDirective],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.css'
})
export class CommentComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly watching = inject(WatchingService);
  private readonly bridge = inject(CourseBridge);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(FeedbackService);

  // Solo registrados pueden comentar/responder/likear
  isRegistered = computed(() => this.bridge.isRegistered());

  // Para el template (avatar del usuario)
  datosUsuario$ = this.authService.currentUser;
  private me?: MeUser;

  // Parámetros
  readonly perPage = 20;
  private courseId!: number;

  // Estado raíz
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  comments = signal<Datum[]>([]);
  owner = signal<OwnerSummary | null>(null);
  page = signal<number>(1);
  hasMore = signal<boolean>(true);

  // NUEVO: total de comentarios del curso (raíz + todas las respuestas)
  totalComments = signal<number>(0);

  // Draft y UI del comentario top-level
  rootDraft = signal<string>('');
  rootActionsVisible = signal<boolean>(false);

  // Estado de respuestas por comentario
  repliesState = signal<Partial<Record<number, ReplyState>>>({});

  // Sentinel
  @ViewChild('infAnchor', { static: true }) infAnchorRef!: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  constructor() {
    this.destroyRef.onDestroy(() => this.ro?.disconnect());
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.courseId = Number(idParam ?? 0);
    this.loadFirstPage();

    // Snapshot del usuario para UI optimista
    this.authService.currentUser
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u: any) => {
        if (!u) { this.me = undefined; return; }
        this.me = {
          id: u.id ?? 0,
          username: u.username ?? 'yo',
          name: u.name ?? 'Tú',
          lastname: u.lastname ?? '',
          profile_picture_url: u.profile_picture_url ?? null
        };
      });

    this.resizeTextarea();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && this.hasMore() && !this.loading()) this.loadMore();
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    if (this.infAnchorRef?.nativeElement) this.observer.observe(this.infAnchorRef.nativeElement);

    this.setupTextareaBase();
    this.resizeTextarea();

    // Observa cambios que afecten el layout del textarea
    const ta = this.ta?.nativeElement;
    if ('ResizeObserver' in window && ta) {
      this.ro = new ResizeObserver(() => this.resizeTextarea());
      this.ro.observe(ta);
    }
  }

  // ------- Carga raíz -------
  loadFirstPage(): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(1);
    this.hasMore.set(true);
    this.comments.set([]);

    const params: PaginationParams = { per_page: this.perPage, page: this.page() };
    this.watching.getCourseComments(this.courseId, params).subscribe({
      next: (res: CommentResponse & { total_comments?: number }) => {
        this.comments.set(res.data ?? []);
        this.owner.set(res.owner ?? null);
        // total del curso (raíz + respuestas)
        this.totalComments.set((res as any).total_comments ?? this.totalComments());
        this.hasMore.set(!!res.links?.next);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los comentarios.');
        this.loading.set(false);
      }
    });
  }

  loadMore(): void {
    if (!this.hasMore() || this.loading()) return;

    this.loading.set(true);
    const nextPage = this.page() + 1;
    const params: PaginationParams = { per_page: this.perPage, page: nextPage };

    this.watching.getCourseComments(this.courseId, params).subscribe({
      next: (res: CommentResponse) => {
        this.comments.set([...this.comments(), ...(res.data ?? [])]);
        this.page.set(nextPage);
        this.hasMore.set(!!res.links?.next);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ------- Helpers de estado de respuestas -------
  private ensureReplyState(commentId: number): ReplyState {
    const full = this.repliesState();
    if (!full[commentId]) {
      full[commentId] = {
        items: [],
        page: 0,
        hasMore: true,
        open: false,
        loading: false,
        composerOpen: false,
        draft: '',
        childOpen: false,
        childDraft: '',
        childTargetId: null,
        childMention: null,
        childTarget: null
      };
      this.repliesState.set({ ...full });
    }
    return this.repliesState()[commentId]!;
  }

  private patchReplyState(commentId: number, patch: Partial<ReplyState>): void {
    const st = this.ensureReplyState(commentId);
    this.repliesState.set({
      ...this.repliesState(),
      [commentId]: { ...st, ...patch }
    });
  }

  // ------- Ver / ocultar respuestas -------
  isOpen = (commentId: number) => !!this.repliesState()[commentId]?.open;

  toggleReplies(parent: Datum): void {
    const st = this.ensureReplyState(parent.id);
    const willOpen = !st.open;
    this.patchReplyState(parent.id, { open: willOpen });

    // Si abre por primera vez, carga
    if (willOpen && !st.items.length && st.hasMore && !st.loading) {
      this.loadMoreReplies(parent);
    }
  }

  loadMoreReplies(parent: Datum): void {
    const st = this.ensureReplyState(parent.id);
    if (!st.hasMore || st.loading) return;

    const nextPage = st.page + 1;
    const params: PaginationParams = { per_page: 10, page: nextPage };

    this.patchReplyState(parent.id, { loading: true });

    this.watching.getCommentReplies(this.courseId, parent.id, params).subscribe({
      next: (res: RepliesResponse) => {
        const merged = [...st.items, ...(res.data ?? [])];
        const hasMore = !!res.links?.next;
        this.patchReplyState(parent.id, {
          items: merged,
          page: nextPage,
          hasMore,
          loading: false,
          open: true
        });
      },
      error: () => this.patchReplyState(parent.id, { loading: false })
    });
  }

  // =======================
  //  ACCIONES: TOP-LEVEL
  // =======================
  onRootFocus(): void {
    if (!this.isRegistered()) return;
    this.rootActionsVisible.set(true);
  }

  cancelTopComment(): void {
    this.rootDraft.set('');
    this.rootActionsVisible.set(false);
    queueMicrotask(() => this.resizeTextarea());
  }

  sendTopComment(): void {
    if (!this.isRegistered()) return;
    const text = this.rootDraft().trim();
    if (!text) return;

    // UI optimista
    const tempId = Date.now();
    const temp: Datum = {
      id: tempId,
      parent_id: null as any,
      text,
      created_at: new Date().toISOString(),
      likes: 0,
      liked_by_me: false,
      liked_by_owner: false as any,
      replies_count: 0,
      user: {
        id: this.me?.id ?? 0,
        username: this.me?.username ?? 'yo',
        name: this.me?.name ?? 'Tú',
        lastname: this.me?.lastname ?? '',
        avatar: this.me?.profile_picture_url ?? null
      } as any
    } as unknown as Datum;

    this.comments.set([temp, ...this.comments()]);
    this.totalComments.set(this.totalComments() + 1);
    this.cancelTopComment();

    // POST real
    this.watching.createComment(this.courseId, { texto: text }).subscribe({
      next: (res: any) => {
        this.replaceTempRoot(tempId, res?.data);
      },
      error: () => {
        // rollback: elimina el temp
        this.comments.set(this.comments().filter(c => c.id !== tempId));
        this.totalComments.set(Math.max(0, this.totalComments() - 1));
      }
    });
  }

  private replaceTempRoot(tempId: number, real?: Datum) {
    if (!real) return;
    const list = this.comments();
    const idx = list.findIndex(c => c.id === tempId);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = real;
      this.comments.set(next);
    }
  }

  // ===================================
  //  ACCIONES: RESPONDER COMENTARIO
  // ===================================
  toggleReplyComposer(parent: Datum): void {
    if (!this.isRegistered()) return;
    const st = this.ensureReplyState(parent.id);
    const willOpen = !st.composerOpen;

    // Asegúrate de abrir replies
    this.patchReplyState(parent.id, { composerOpen: willOpen, open: true });

    // Cerrar composer hijo si estaba abierto
    if (st.childOpen) {
      this.patchReplyState(parent.id, { childOpen: false, childDraft: '', childTargetId: null, childMention: null, childTarget: null });
    }

    // Focus
    if (willOpen) {
      queueMicrotask(() => {
        const el = document.getElementById(`reply-input-${parent.id}`) as HTMLTextAreaElement | null;
        el?.focus();
      });
    }
  }

  updateDraft(parentId: number, value: string): void {
    this.patchReplyState(parentId, { draft: value });
  }

  cancelReplyToComment(parent: Datum): void {
    this.patchReplyState(parent.id, { composerOpen: false, draft: '' });
  }

  sendReplyToComment(parent: Datum & { all_replies_count?: number }): void {
    if (!this.isRegistered()) return;
    const st = this.ensureReplyState(parent.id);
    const text = (st.draft ?? '').trim();
    queueMicrotask(() => this.resizeTextarea());
    if (!text) return;

    // UI optimista
    const tempId = Date.now();
    const temp: Datum = {
      id: tempId,
      parent_id: parent.id,
      text,
      created_at: new Date().toISOString(),
      likes: 0,
      liked_by_me: false,
      replies_count: 0,
      user: {
        id: this.me?.id ?? 0,
        username: this.me?.username ?? 'yo',
        name: this.me?.name ?? 'Tú',
        lastname: this.me?.lastname ?? '',
        avatar: this.me?.profile_picture_url ?? null
      } as any,
      reply_to: parent.user // para que se vea a quién respondes
    } as unknown as Datum;

    this.patchReplyState(parent.id, {
      items: [temp, ...st.items],
      draft: '',
      composerOpen: false,
      open: true
    });

    // incrementos correctos
    parent.replies_count = (parent.replies_count || 0) + 1;               // hijos directos
    parent.all_replies_count = (parent.all_replies_count || 0) + 1;       // total descendientes
    this.totalComments.set(this.totalComments() + 1);                      // total del curso

    // POST real
    this.watching.createComment(this.courseId, { texto: text, parent_id: parent.id }).subscribe({
      next: (res) => {
        this.replaceTempReply(parent.id, tempId, res?.data);
      },
      error: () => {
        // rollback
        const st2 = this.ensureReplyState(parent.id);
        this.patchReplyState(parent.id, {
          items: st2.items.filter(i => i.id !== tempId)
        });
        parent.replies_count = Math.max(0, (parent.replies_count || 0) - 1);
        parent.all_replies_count = Math.max(0, (parent.all_replies_count || 0) - 1);
        this.totalComments.set(Math.max(0, this.totalComments() - 1));
      }
    });
  }

  private replaceTempReply(parentId: number, tempId: number, real?: Datum) {
    if (!real) return;
    const st = this.ensureReplyState(parentId);
    const idx = st.items.findIndex(i => i.id === tempId);
    if (idx >= 0) {
      const arr = [...st.items];
      arr[idx] = real;
      this.patchReplyState(parentId, { items: arr });
    }
  }

  // ===================================
  //  ACCIONES: RESPONDER RESPUESTA
  // ===================================
  openChildReplyComposer(parent: Datum, target: Datum): void {
    if (!this.isRegistered()) return;

    const mention = target?.user?.username ? `@${target.user.username}` : null;

    this.patchReplyState(parent.id, {
      childOpen: true,
      childDraft: '',             // NO insertamos @ dentro del textarea
      childTargetId: target.id,
      childTarget: target,
      childMention: mention,      // mostramos el chip a la izquierda
      composerOpen: false,        // cierra el composer de nivel 1
      open: true
    });

    queueMicrotask(() => {
      const el = document.getElementById(`child-reply-input-${parent.id}`) as HTMLTextAreaElement | null;
      el?.focus();
    });
  }

  updateChildDraft(parentId: number, value: string): void {
    this.patchReplyState(parentId, { childDraft: value });
  }

  cancelReplyToReply(parent: Datum): void {
    this.patchReplyState(parent.id, {
      childOpen: false,
      childDraft: '',
      childTargetId: null,
      childMention: null,
      childTarget: null
    });
  }

  sendReplyToReply(parent: (Datum & { all_replies_count?: number })): void {
    if (!this.isRegistered()) return;
    const st = this.ensureReplyState(parent.id);
    const targetId = st.childTargetId!;
    let text = (st.childDraft ?? '').trim();
    if (!text || !targetId) return;

    // UI optimista
    const tempId = Date.now();
    const temp: Datum = {
      id: tempId,
      parent_id: targetId, // responde a la RESPUESTA real
      text,                // sin @mention en el contenido
      created_at: new Date().toISOString(),
      likes: 0,
      liked_by_me: false,
      replies_count: 0,
      user: {
        id: this.me?.id ?? 0,
        username: this.me?.username ?? 'yo',
        name: this.me?.name ?? 'Tú',
        lastname: this.me?.lastname ?? '',
        avatar: this.me?.profile_picture_url ?? null
      } as any,
      reply_to: st.childTarget?.user // para mostrar @inline en la lista
    } as unknown as Datum;

    this.patchReplyState(parent.id, {
      items: [temp, ...st.items],
      childOpen: false,
      childDraft: '',
      childTargetId: null,
      childMention: null,
      childTarget: null,
      open: true
    });

    // incrementos correctos
    parent.all_replies_count = (parent.all_replies_count || 0) + 1;       // total descendientes
    this.totalComments.set(this.totalComments() + 1);                      // total del curso

    // POST real (usa el endpoint genérico con parent_id=targetId)
    this.watching.createComment(this.courseId, { texto: text, parent_id: targetId }).subscribe({
      next: (res) => {
        this.replaceTempReply(parent.id, tempId, res?.data);
      },
      error: () => {
        // rollback
        const st2 = this.ensureReplyState(parent.id);
        this.patchReplyState(parent.id, {
          items: st2.items.filter(i => i.id !== tempId)
        });
        parent.all_replies_count = Math.max(0, (parent.all_replies_count || 0) - 1);
        this.totalComments.set(Math.max(0, this.totalComments() - 1));
      }
    });
  }

  // ------- Likes (UI optimista + backend) -------
  toggleLike(commentOrReply: Datum): void {
    if (!this.isRegistered()) return;

    const wasLiked = commentOrReply.liked_by_me;
    const prevLikes = commentOrReply.likes;

    // Optimista
    commentOrReply.liked_by_me = !wasLiked;
    commentOrReply.likes = wasLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;

    this.feedback.setLikedComment(commentOrReply.id, !wasLiked).subscribe({
      next: (res) => {
        if (typeof res.liked === 'boolean') commentOrReply.liked_by_me = res.liked;
        if (typeof (res as any).likes === 'number') commentOrReply.likes = (res as any).likes;
      },
      error: () => {
        // rollback
        commentOrReply.liked_by_me = wasLiked;
        commentOrReply.likes = prevLikes;
      }
    });
  }

  // ------- Helpers -------
  trackById = (_: number, c: Datum) => c.id;

  timeAgo(dateIso?: string): string {
    if (!dateIso) return '';
    const date = new Date(dateIso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    const r = (n: number, u: string) => `hace ${n} ${u}${n !== 1 ? 's' : ''}`;
    if (diff < 60) return r(diff, 'segundo');
    const m = Math.floor(diff / 60); if (m < 60) return r(m, 'minuto');
    const h = Math.floor(m / 60); if (h < 24) return r(h, 'hora');
    const d = Math.floor(h / 24); if (d < 30) return r(d, 'día');
    const mo = Math.floor(d / 30); if (mo < 12) return r(mo, 'mes');
    const y = Math.floor(mo / 12); return r(y, 'año');
  }

  @ViewChild('ta') ta?: ElementRef<HTMLTextAreaElement>;
  private ro?: ResizeObserver;

  // Llama una vez al iniciar para preparar el textarea (overflow y resize)
  private setupTextareaBase() {
    const ta = this.ta?.nativeElement;
    if (!ta) return;
    ta.style.overflowY = 'hidden';
    ta.style.resize = 'none';
  }

  // Calcula el alto en base al contenido
  private resizeTextarea() {
    const ta = this.ta?.nativeElement;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight + 2}px`;
  }

  @HostListener('window:resize') onWinResize() { this.resizeTextarea(); }

  onRootInput(ev: Event) {
    const el = ev.target as HTMLTextAreaElement;
    this.rootDraft.set(el.value ?? '');
    this.resizeTextarea();
  }
}
