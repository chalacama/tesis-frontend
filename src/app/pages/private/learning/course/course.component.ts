import { Component, OnInit, inject, signal, effect ,  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet , NavigationEnd,} from '@angular/router';
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
  imports: [CommonModule, IconComponent, ButtonComponent,
    RouterOutlet,
    CommentComponent,
    DetailComponent],
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
  constructor() {
    // Evalúa la URL inicial
this.syncViewModeFromUrl(this.router.url);

// Reacciona a cambios de ruta (content <-> test)
this.router.events
  .pipe(
    // Solo cuando termina la navegación
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    takeUntilDestroyed()
  )
  .subscribe(e => this.syncViewModeFromUrl(e.urlAfterRedirects));

  }

  readonly viewMode = signal<'content' | 'test'>('content');
  // Datos
  readonly modules = signal<ModuleItem[]>([]);
  readonly openSet = signal<Set<number>>(new Set<number>());

  // Activo
  readonly activeChapterId = signal<number | null>(null);

  // Aux para abrir módulo del capítulo activo rápido
  private chapterIdToModuleId = new Map<number, number>();

  private syncViewModeFromUrl(url: string): void {
  // Quita query/hash y toma el último segmento
  const last = url.split('?')[0].split('#')[0].split('/').filter(Boolean).pop();
  this.viewMode.set(last === 'test' ? 'test' : 'content');
}
  // Helpers para el template
isTestView = () => this.viewMode() === 'test';
isContentView = () => this.viewMode() === 'content';
  ngOnInit(): void {
    
    const courseId = this.getCourseParam('id'); // del /course/:title/:id
    if (!courseId) {
      this.error.set('No se pudo obtener el ID del curso.');
      this.loading.set(false);
      return;
    }

    this.watchingSvc.getCourseWatching(courseId).subscribe({
      next: (res: WatchingResponse) => {
        
        // Mapear módulos/ capítulos
        const uiModules = this.mapApiToUiModules(res.course.modules);
        this.firstChapterId = uiModules[0]?.chapters[0]?.id ?? null;
        this.modules.set(uiModules);
        // IDs completados que vienen de la API
        const initialCompletedIds = uiModules
      .flatMap(m => m.chapters)
      .filter(c => c.completed)
      .map(c => c.id);
      this.bridge.seedCompleted(initialCompletedIds);
        // Construir índice capítulo -> módulo
        this.indexChapterToModule(uiModules);

        this.bridge.setRegistered(!!res.course.is_registered);

        // Resolver capítulo activo (ruta -> último visto -> primero)
        const routeChapterId = this.getCourseParam('chapterId');
        const computedActive = this.resolveInitialActiveChapterId(
          routeChapterId ? Number(routeChapterId) : null,
          (res.course as any)?.last_viewed_chapter
        );

        // Fijar activo y abrir su módulo
        this.setActiveChapter(computedActive, /*openModule*/ true);

        // Si la ruta no traía capítulo, actualiza URL con el activo resuelto
        if (!routeChapterId && computedActive) {
          const courseTitle = this.getCourseParam('title') ?? this.slugify(res.course.title);
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
  const completed = this.bridge.completed(); // Set<number>
  
  if (!completed) return;

  // Actualiza módulos sin mutar estructuras previas
  const next = this.modules().map(m => ({
    ...m,
    chapters: m.chapters.map(c => {
      const isDone = completed.has(c.id) || c.completed;
      // Evita reconstruir objetos si no hay cambio
      return isDone === c.completed ? c : { ...c, completed: isDone };
    })
  }));

  this.modules.set(next);

  });

  }
isFirstChapter = (chapterId: number) => this.firstChapterId === chapterId;
  /** Lee parámetro de ruta (soporta parent anidado) */
  private getCourseParam(key: string): string | null {
    return (
      this.route.snapshot.paramMap.get(key) ??
      this.route.parent?.snapshot.paramMap.get(key) ??
      null
    );
  }

  /** Mapea API → UI */
  private mapApiToUiModules(apiModules: ApiModule[]): ModuleItem[] {
    return apiModules.map(m => ({
      id: m.id,
      name: m.name,
      chapters: this.mapApiChaptersToUi(m.chapters),
    }));
  }

  private mapApiChaptersToUi(chapters: ApiChapter[]): ChapterItem[] {
    return chapters.map(c => ({
      id: c.id,
      title: c.title,
      questions: c.questions_count,
      learningType: (c.learning?.type as 'youtube' | 'archivo' | null) ?? null,
      format: c.learning?.format ?? null,
      completed: !!c.completed_chapter?.is_completed,
    }));
  }

  /** Índice rápido capítulo -> módulo */
  private indexChapterToModule(mods: ModuleItem[]) {
    this.chapterIdToModuleId.clear();
    for (const m of mods) {
      for (const c of m.chapters) this.chapterIdToModuleId.set(c.id, m.id);
    }
  }

  /** Determina capítulo inicial activo */
  private resolveInitialActiveChapterId(routeChapterId: number | null, lastViewed: any): number | null {
    // 1) Si viene en ruta y existe, usarlo
    if (routeChapterId && this.findChapterById(routeChapterId)) return routeChapterId;

    // 2) Si no, usar last_viewed_chapter del API (acepta content_view o content_views)
    const lastId = lastViewed?.chapter_id ?? null;
    if (lastId && this.findChapterById(lastId)) return lastId;

    // 3) Si no, el primero por orden (primer módulo abierto y su primer capítulo)
    const firstModule = this.modules()[0];
    if (firstModule && firstModule.chapters.length > 0) return firstModule.chapters[0].id;

    return null;
  }

  /** Fija capítulo activo y (opcional) abre su módulo */
  private setActiveChapter(chapterId: number | null, openModule = false) {
    this.activeChapterId.set(chapterId);
    if (openModule && chapterId) {
      const modId = this.chapterIdToModuleId.get(chapterId);
      if (modId) this.openSet.set(new Set([modId]));
    } else if (this.modules().length > 0) {
      // fallback: abrir el primero
      this.openSet.set(new Set([this.modules()[0].id]));
    }
  }

  /** Buscar capítulo por id */
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

  /** ¿Este capítulo es el activo (último visto/actual)? */
  isActiveChapter = (chapterId: number) => this.activeChapterId() === chapterId;

  /** Icono para el tipo de learning */
  learningIcon(ch: ChapterItem): string | null {
    if (ch.format === 'mp4'){
      return 'svg/youtube.svg';
    }else {
      return 'svg/file.svg';
    }
    
    return null;
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

    if (c.learningType){
      this.router.navigate(
      ['/learning', 'course', courseTitle, courseId, this.slugify(c.title), c.id,'content'],
      { replaceUrl: false }
      
    );
    }else if (c.questions > 0){
      this.router.navigate(
        ['/learning', 'course', courseTitle, courseId, this.slugify(c.title), c.id,'test'],
        { replaceUrl: false }
      );
    }
    
  }

  /** Slug simple para URL */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  trackByModule = (_: number, m: ModuleItem) => m.id;
  trackByChapter = (_: number, c: ChapterItem) => c.id;

  showModule() { this.visibleModule = !this.visibleModule; }

  sizeModule() { this.smallModule = !this.smallModule; }
}
