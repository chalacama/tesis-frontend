import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { concatMap, catchError, tap } from 'rxjs/operators';

import { ButtonComponent } from '../../../../../shared/UI/components/button/button/button.component';
import { LoadingBarComponent } from '../../../../../shared/UI/components/overlay/loading-bar/loading-bar.component';

import { WatchingService } from '../../../../../core/api/watching/watching.service';
import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';

import {
  TestIndexResponse,
  TestQuestion,
  TestPageQuery,
  TestShowResponse,
  TestShowData
} from '../../../../../core/api/watching/test.interface';
import { CourseBridge } from '../../../../../core/api/watching/course-bridge.service';
import { NotificationBridgeService } from '../../../../../core/api/notification/notification-bridge.service';
import { ToastComponent } from '../../../../../shared/UI/components/overlay/toast/toast.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LoadingBarComponent],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly watchingApi = inject(WatchingService);
  private readonly feedbackApi = inject(FeedbackService);
  private readonly destroyRef = inject(DestroyRef);
   private readonly bridge = inject(CourseBridge);
   private readonly notificationBridge = inject(NotificationBridgeService); // 👈 NUEVO
  
  // ---- state base ----
  loading    = signal<boolean>(false);
  submitting = signal<boolean>(false);
  chapterId  = signal<number | null>(null);
  page       = signal<number>(1);
  perPage    = signal<number>(5);

  // modos: 'hub' | 'answer' | 'review'
  mode = signal<'hub' | 'answer' | 'review'>('hub');

  // show() → header + intents + flags
  showResp = signal<TestShowResponse | null>(null);
  showData = computed<TestShowData | null>(() => this.showResp()?.data ?? null);

  // index() → preguntas (paginadas)
  resp = signal<TestIndexResponse | null>(null);
  testViewId = signal<number | null>(null);

  questions = computed(() => this.resp()?.data.questions ?? []);
  pg        = computed(() => this.resp()?.pagination ?? null);

  // selección por pregunta
  selection = signal<Partial<Record<number, number[]>>>({});

  // cola de autosaves
  private autosaveQueue$ = new Subject<{ question_id: number; answer_ids: number[] }>();

  constructor() {
    // ChapterId desde la ruta
    effect(() => {
      const parent = this.route.parent;
      const chapterIdParam =
        parent?.snapshot.paramMap.get('chapterId') ??
        this.route.snapshot.paramMap.get('chapterId');
      if (chapterIdParam) {
        const cid = Number(chapterIdParam);
        if (!Number.isNaN(cid)) {
          this.chapterId.set(cid);
          this.page.set(1);
          this.bootstrap(); // carga show y decide modo inicial
        }
      }
    });

    // Cargar página del cuestionario cuando: chapterId/page cambien y el modo sea answer|review
    effect(() => {
      const cid  = this.chapterId();
      const p    = this.page();
      const mode = this.mode();
      if (!cid) return;
      if (mode === 'answer' || mode === 'review') {
        this.fetchPage(cid, {
          page: p,
          per_page: this.perPage(),
          review_last: mode === 'review'
        });
      }
    });

    // Procesar autosaves (solo en modo 'answer')
    this.autosaveQueue$
      .pipe(
        concatMap((payload) => {
          if (this.mode() !== 'answer') return of(null);
          const tvId = this.testViewId();
          if (!tvId) return of(null);
          return this.watchingApi.autosaveAnswer(tvId, { ...payload, mode: 'replace' }).pipe(
            tap(() => { /* ok */ }),
            catchError((err) => {
              console.error('Autosave ERROR', err);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // ---- bootstrap: carga show y decide modo ----
  private bootstrap() {
    const cid = this.chapterId();
    if (!cid) return;

    this.loading.set(true);
    this.watchingApi.getTestShow(cid).subscribe({
      next: (res) => {
        this.showResp.set(res);
        // Si hay intento en progreso → entrar a responder automáticamente
        const inProgressId = res.data.attempts.in_progress_test_view_id;
        if (inProgressId) {
          this.mode.set('answer');
          this.page.set(1); // asegúrate de empezar desde la primera página
        } else {
          // Hub por defecto (inicio o ya completado)
          this.mode.set('hub');
          this.resp.set(null);
          this.testViewId.set(null);
          this.selection.set({});
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---- API index ----
  private fetchPage(chapterId: number, params: TestPageQuery) {
    this.loading.set(true);
    this.watchingApi.getTestPage(chapterId, params).subscribe({
      next: (res) => {
        this.resp.set(res);
        if (res?.context?.test_view_id) this.testViewId.set(res.context.test_view_id);

        // Inyectar selección actual
        const merged = { ...this.selection() };
        for (const q of res.data.questions) {
          const marked = q.answers.filter(a => !!a.selected).map(a => a.id);
          merged[q.question_id] = marked;
        }
        this.selection.set(merged);

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ---- helpers de tipo ----
  isSingle(q: TestQuestion)   { return q.type?.key === 'single'; }
  isMultiple(q: TestQuestion) { return q.type?.key === 'multiple'; }

  // ---- selección (bloquea en review) ----
  onRadioSelect(q: TestQuestion, answerId: number) {
    if (this.mode() !== 'answer') return;
    const next = { ...this.selection() };
    next[q.question_id] = [answerId];
    this.selection.set(next);
    this.queueAutosave(q.question_id, next[q.question_id]!);
  }

  onCheckboxToggle(q: TestQuestion, answerId: number, checked: boolean) {
    if (this.mode() !== 'answer') return;
    const current = { ...this.selection() };
    const set = new Set(current[q.question_id] ?? []);
    if (checked) set.add(answerId); else set.delete(answerId);
    current[q.question_id] = Array.from(set);
    this.selection.set(current);
    this.queueAutosave(q.question_id, current[q.question_id]!);
  }

  private queueAutosave(questionId: number, answerIds: number[]) {
    if (!this.testViewId()) return;
    this.autosaveQueue$.next({ question_id: questionId, answer_ids: answerIds });
  }

  // ---- paginación ----
  prevPage() {
    const p = this.page();
    if (p > 1 && !this.loading()) this.page.set(p - 1);
  }
  nextPage() {
    const p = this.page();
    const last = this.pg()?.last_page ?? 1;
    if (p < last && !this.loading()) this.page.set(p + 1);
  }

  // ---- acciones de modo ----
  startAnswer() {
    const cid = this.chapterId();
    if (!cid) return;
    this.mode.set('answer');
    this.page.set(1);
    // fetchPage se dispara por effect()
  }

  startReview() {
    const data = this.showData();
    if (!data?.can_view_last_answers) return;
    const cid = this.chapterId();
    if (!cid) return;
    this.mode.set('review');
    this.page.set(1);
    // fetchPage se dispara por effect()
  }

  backToHub() {
    this.mode.set('hub');
    this.page.set(1);
    // refrescar header (scores, flags)
    this.bootstrap();
  }

  // ---- enviar (finalizar intento) ----
   submit() {
    const tvId = this.testViewId();
    const chapterId = this.chapterId();
    if (!tvId) return;

    this.submitting.set(true);
    this.feedbackApi.completeTest(tvId).subscribe({
      next: (res) => {
        this.submitting.set(false);

        // ⚠️ Ajusta esta parte a la estructura real de tu respuesta
        const completed = res?.data?.chapter_completed ?? true; // si tu API ya controla el aprobado
        if (completed && chapterId) {
          this.bridge.markChapterCompleted(chapterId);
        }
        if (res.data?.certificate_issued) {
        this.notificationBridge.increment(1);
        this.bridge.notifyCertificateIssued();
        
      }

        // Volver al hub y refrescar meta (score, attempts, flags)
        this.backToHub();
      },
      error: (err) => {
        console.error('completeTest ERROR', err);
        this.submitting.set(false);
      }
    });
  }

  // ---- UI helpers ----
  trackQ = (_: number, q: TestQuestion) => q.question_id;
  trackA = (_: number, a: { id: number }) => a.id;

  // estados para template
  canRetry = computed(() => this.showData()?.attempts.can_retry ?? false);
  canView  = computed(() => this.showData()?.can_view_last_answers ?? false);
  inProgressId = computed(() => this.showData()?.attempts.in_progress_test_view_id ?? null);

  // flags de header
  headerCourse = computed(() => this.showData()?.course_title ?? null);
  headerChapter = computed(() => this.showData()?.chapter_title ?? '');
  questionsCount = computed(() => this.showData()?.test.questions_count ?? 0);
  limit = computed(() => this.showData()?.test.limited ?? 0);
  attemptsCompleted = computed(() => this.showData()?.attempts.completed ?? 0);
  lastScore = computed(() => this.showData()?.last_score ?? null);
  lastCompletedAt = computed(() => this.showData()?.last_completed_at ?? null);

  // para template
  isReview = computed(() => this.mode() === 'review');
  isAnswer = computed(() => this.mode() === 'answer');
  isHub    = computed(() => this.mode() === 'hub');
}
