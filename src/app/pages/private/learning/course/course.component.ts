import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { IconComponent } from '../../../../shared/UI/components/button/icon/icon.component';
import { ButtonComponent } from '../../../../shared/UI/components/button/button/button.component';
import { WatchingService } from '../../../../core/api/watching/watching.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Chapter as ApiChapter,
  Module as ApiModule,
  WatchingResponse
} from '../../../../core/api/watching/structure.interface';

import { CommentComponent } from './comment/comment.component';
import { DetailComponent } from './detail/detail.component';
import { CourseBridge } from '../../../../core/api/watching/course-bridge.service';
import { filter } from 'rxjs';

type ChapterItem = {
  id: number;
  title: string;
  questions: number;
  learningType: 'youtube' | 'archivo' | null;
  format: string | null;
  completed: boolean;
};

type ModuleItem = {
  id: number;
  name: string;
  chapters: ChapterItem[];
};

@Component({
  selector: 'app-course',
  standalone: true,
  providers: [CourseBridge],
  imports: [
    CommonModule,
    IconComponent,
    ButtonComponent,
    RouterOutlet,
    CommentComponent,
    DetailComponent
  ],
  templateUrl: './course.component.html',
  styleUrl: './course.component.css'
})
export class CourseComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly watchingSvc = inject(WatchingService);
  readonly bridge = inject(CourseBridge);

  private firstChapterId: number | null = null;

  // UI state
  visibleModule = true;
  smallModule = false;
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  readonly viewMode = signal<'content' | 'test'>('content');
  readonly modules = signal<ModuleItem[]>([]);
  readonly openSet = signal<Set<number>>(new Set<number>());
  readonly activeChapterId = signal<number | null>(null);

  // Esqueletos
  readonly skeletonModules = Array.from({ length: 3 });
  readonly skeletonChapters = Array.from({ length: 3 });

  // Contexto actual: módulo / capítulo activo (para el drawer horizontal)
  readonly activeContext = computed<{
    module: ModuleItem;
    chapter: ChapterItem;
    moduleIndex: number;
    chapterIndex: number;
  } | null>(() => {
    const mods = this.modules();
    const activeId = this.activeChapterId();

    if (!mods.length || !activeId) return null;

    for (let mi = 0; mi < mods.length; mi++) {
      const m = mods[mi];
      const ci = m.chapters.findIndex(c => c.id === activeId);
      if (ci !== -1) {
        return {
          module: m,
          chapter: m.chapters[ci],
          moduleIndex: mi,
          chapterIndex: ci
        };
      }
    }

    return null;
  });

  constructor() {
    // Evalúa la URL inicial
    this.syncViewModeFromUrl(this.router.url);

    // Reacciona a cambios de ruta (content <-> test)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(e => this.syncViewModeFromUrl(e.urlAfterRedirects));
  }

  private syncViewModeFromUrl(url: string): void {
    const last = url
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .filter(Boolean)
      .pop();
    this.viewMode.set(last === 'test' ? 'test' : 'content');
  }

  isTestView = () => this.viewMode() === 'test';
  isContentView = () => this.viewMode() === 'content';

  ngOnInit(): void {
    const courseId = this.getCourseParam('id');
    if (!courseId) {
      this.error.set('No se pudo obtener el ID del curso.');
      this.loading.set(false);
      return;
    }

    this.watchingSvc.getCourseWatching(courseId).subscribe({
      next: (res: WatchingResponse) => {
        const uiModules = this.mapApiToUiModules(res.course.modules);
        this.firstChapterId = uiModules[0]?.chapters[0]?.id ?? null;
        this.modules.set(uiModules);

        const initialCompletedIds = uiModules
          .flatMap(m => m.chapters)
          .filter(c => c.completed)
          .map(c => c.id);
        this.bridge.seedCompleted(initialCompletedIds);

        this.indexChapterToModule(uiModules);
        this.bridge.setRegistered(!!res.course.is_registered);

        const routeChapterId = this.getCourseParam('chapterId');
        const computedActive = this.resolveInitialActiveChapterId(
          routeChapterId ? Number(routeChapterId) : null,
          (res.course as any)?.last_viewed_chapter
        );

        this.setActiveChapter(computedActive, /*openModule*/ true);

        if (!routeChapterId && computedActive) {
          const courseTitle =
            this.getCourseParam('title') ?? this.slugify(res.course.title);
          const chapter = this.findChapterById(computedActive);
          if (chapter) {
            this.router.navigate(
              [
                '/learning',
                'course',
                courseTitle,
                res.course.id,
                this.slugify(chapter.title),
                chapter.id,
                'content'
              ],
              { replaceUrl: true }
            );
          }
        }

        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set('No se pudo cargar el curso.');
        console.error(err);
        this.loading.set(false);
      }
    });

    effect(() => {
      const completed = this.bridge.completed();
      if (!completed) return;

      const next = this.modules().map(m => ({
        ...m,
        chapters: m.chapters.map(c => {
          const isDone = completed.has(c.id) || c.completed;
          return isDone === c.completed ? c : { ...c, completed: isDone };
        })
      }));
      this.modules.set(next);
    });
  }

  isFirstChapter = (chapterId: number) => this.firstChapterId === chapterId;

  private getCourseParam(key: string): string | null {
    return (
      this.route.snapshot.paramMap.get(key) ??
      this.route.parent?.snapshot.paramMap.get(key) ??
      null
    );
  }

  private mapApiToUiModules(apiModules: ApiModule[]): ModuleItem[] {
    return apiModules.map(m => ({
      id: m.id,
      name: m.name,
      chapters: this.mapApiChaptersToUi(m.chapters)
    }));
  }

  private mapApiChaptersToUi(chapters: ApiChapter[]): ChapterItem[] {
    return chapters.map(c => ({
      id: c.id,
      title: c.title,
      questions: c.questions_count,
      learningType: (c.learning?.type as 'youtube' | 'archivo' | null) ?? null,
      format: c.learning?.format ?? null,
      completed: !!c.completed_chapter?.is_completed
    }));
  }

  private indexChapterToModule(mods: ModuleItem[]) {
    this.chapterIdToModuleId.clear();
    for (const m of mods) {
      for (const c of m.chapters) this.chapterIdToModuleId.set(c.id, m.id);
    }
  }

  private resolveInitialActiveChapterId(
    routeChapterId: number | null,
    lastViewed: any
  ): number | null {
    if (routeChapterId && this.findChapterById(routeChapterId)) {
      return routeChapterId;
    }

    const lastId = lastViewed?.chapter_id ?? null;
    if (lastId && this.findChapterById(lastId)) return lastId;

    const firstModule = this.modules()[0];
    if (firstModule && firstModule.chapters.length > 0) {
      return firstModule.chapters[0].id;
    }

    return null;
  }

  private chapterIdToModuleId = new Map<number, number>();

  private setActiveChapter(chapterId: number | null, openModule = false) {
    this.activeChapterId.set(chapterId);
    if (openModule && chapterId) {
      const modId = this.chapterIdToModuleId.get(chapterId);
      if (modId) this.openSet.set(new Set([modId]));
    } else if (this.modules().length > 0) {
      this.openSet.set(new Set([this.modules()[0].id]));
    }
  }

  private findChapterById(id: number): ChapterItem | null {
    for (const m of this.modules()) {
      const found = m.chapters.find(c => c.id === id);
      if (found) return found;
    }
    return null;
  }

  // === UI helpers ===
  isOpen = (moduleId: number) => this.openSet().has(moduleId);

  toggle(moduleId: number): void {
    const next = new Set(this.openSet());
    next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
    this.openSet.set(next);
  }

  isActiveChapter = (chapterId: number) => this.activeChapterId() === chapterId;

  learningIcon(ch: ChapterItem): string | null {
    if (ch.format === 'mp4') {
      return 'svg/youtube.svg';
    } else {
      return 'svg/file.svg';
    }
  }

  statusIcon(ch: ChapterItem): string {
    return ch.completed ? 'svg/check.svg' : 'svg/clock.svg';
  }

  statusSeverity(ch: ChapterItem): 'success' | 'warn' | 'muted' {
    return ch.completed ? 'success' : 'warn';
  }

  /** Click en capítulo → navegar + activar */
  selectChapter(c: ChapterItem): void {
    const courseTitle = this.getCourseParam('title') ?? 'curso';
    const courseId = this.getCourseParam('id')!;
    this.setActiveChapter(c.id, /*openModule*/ true);

    if (c.learningType) {
      this.router.navigate(
        [
          '/learning',
          'course',
          courseTitle,
          courseId,
          this.slugify(c.title),
          c.id,
          'content'
        ],
        { replaceUrl: false }
      );
    } else if (c.questions > 0) {
      this.router.navigate(
        [
          '/learning',
          'course',
          courseTitle,
          courseId,
          this.slugify(c.title),
          c.id,
          'test'
        ],
        { replaceUrl: false }
      );
    }
  }

  /** Click en módulo desde el drawer horizontal */
  selectModuleFromDrawer(mod: ModuleItem): void {
    if (!mod) return;

    // Abrimos sólo este módulo en el panel lateral
    this.openSet.set(new Set<number>([mod.id]));

    const current = this.activeChapterId();
    const alreadyInside = current
      ? mod.chapters.some(c => c.id === current)
      : false;

    // Si el capítulo activo NO está en este módulo, saltamos al primero
    if (!alreadyInside && mod.chapters.length > 0) {
      this.selectChapter(mod.chapters[0]);
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  trackByModule = (_: number, m: ModuleItem) => m.id;
  trackByChapter = (_: number, c: ChapterItem) => c.id;

  showModule() {
    this.visibleModule = !this.visibleModule;
  }

  sizeModule() {
    this.smallModule = !this.smallModule;
  }
}
