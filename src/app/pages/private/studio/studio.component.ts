import { ApplicationRef, Component, effect, inject, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ParamMap, Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, Observable, Subject, tap } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntil, map, first} from 'rxjs/operators';
import { HostListener } from '@angular/core';
import { ThemeService } from '../../../shared/services/theme.service';
import { AuthService } from '../../../core/api/auth/auth.service';
import { User } from '../../../core/api/auth/auth.interfaces';

import { CourseService } from '../../../core/api/course/course.service';
import { StudioService } from '../../../core/api/studio/studio.service';
import { MiniatureResponse } from '../../../core/api/studio/studio.interface';
import { PreviewComponent } from '../../../shared/UI/components/media/preview/preview.component';
import { ButtonComponent } from '../../../shared/UI/components/button/button/button.component';
import { AvatarComponent } from '../../../shared/UI/components/media/avatar/avatar.component';
import { Portfolio } from '../../../core/api/profile/portfolio.interface';
import { SearchComponent } from '../../../shared/UI/components/data/search/search.component';
import { NotificationComponent } from '../../../shared/UI/components/data/notification/notification.component';
import { ExploreComponent } from '../../../shared/UI/components/data/explore/explore.component';
import { StudioBridgeService } from '../../../core/api/studio/studio-bridge.service';
import { OnDestroy } from '@angular/core';
import { ModuleService } from '../../../core/api/module/module.service';
import { ModuleResponse, Chapters } from '../../../core/api/module/module.interface';
import { IconComponent } from '../../../shared/UI/components/button/icon/icon.component';

@Component({
  selector: 'app-studio',
  imports: [RouterOutlet, CommonModule , PreviewComponent,ButtonComponent, AvatarComponent , SearchComponent , NotificationComponent , ExploreComponent , IconComponent],
  templateUrl: './studio.component.html',
  styleUrl: './studio.component.css'
})
export class StudioComponent implements OnInit , OnDestroy {

    datosUsuario$!: Observable<User | null>;
    currentTheme: 'light' | 'dark' | 'system' = 'system';
    currentRoute: string = '';
    isSidebarCollapsed = false;
    isSidebarClose = true;
    prefersDarkMode: boolean = false;
    isdrawer = false;
    isMobile = false;
    isTablet = false;

    portfolioData?: Portfolio;
    hasExternalUser = false;
    hasExternalCourse = false;
    miniatureData?: MiniatureResponse;

    usernameEdit?: string;

    private destroy$ = new Subject<void>();
    private readonly studioBridge = inject(StudioBridgeService);

    // ✅ NUEVO: loaders (skeleton)
  portfolioLoading = false;
  miniatureLoading = false;
// ✅ NUEVO: detectar si estamos en ruta de capítulo
isChapterRoute = false;

// ✅ NUEVO: params activos
courseId?: number;
activeModuleId: number | null = null;
activeChapterId: number | null = null;

// ✅ NUEVO: módulos/capítulos para el acordeón
courseModules: ModuleResponse[] = [];
modulesLoading = false;
modulesError = false;

// ✅ accordion
openModuleId: number | null = null;

// ✅ skeleton helpers
skeletonModules = Array.from({ length: 3 });
skeletonChapters = Array.from({ length: 6 });

// para evitar recargar módulos si ya están cargados para ese curso
private modulesLoadedForCourseId: number | null = null;

// smallModule = collapsed del sidebar
get smallModule(): boolean {
  return this.isSidebarCollapsed;
}

    constructor(
      private themeService: ThemeService,
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router,
      private authService: AuthService,
      private breakpointObserver: BreakpointObserver,
      private renderer: Renderer2,
      private appRef : ApplicationRef,
      private route: ActivatedRoute,
      // private courseService: CourseService,
      private studioService: StudioService,
      private moduleService: ModuleService,

    ) {
      this.setupRouterSubscription();
      this.setupStudioBridgeListener();
      // this.setupChapterRouteListener(); // ✅ nuevo
    }
  
    ngOnInit() {
  
      this.initializeUserData();
      this.initializeTheme();
      this.setupBreakpointObservers();
      this.setupAppStabilitySubscription();
      this.checkIfExternalUser();
      this.checkIfExternalCourse();
      this.usernameEdit =this.portfolioData?.username

      this.appRef.isStable
  .pipe(first(isStable => isStable === true))
  .subscribe(() => {
    this.renderer.removeClass(document.body, 'app-loading');
  });
  
   this.setupChapterRouteListener();
  
    }
    private setupStudioBridgeListener(): void {
  effect(() => {
    const update = this.studioBridge.courseUpdate();
    if (!update) return;

    // ID del curso actual en la ruta
    const currentIdParam = this.route.snapshot.paramMap.get('id');
    const currentId = currentIdParam ? Number(currentIdParam) : NaN;

    // Solo reaccionar si el update corresponde al curso que se está editando
    if (!Number.isFinite(currentId) || currentId !== update.id) {
      return;
    }

    // Si aún no tenemos miniatureData (por alguna razón), salimos
    if (!this.miniatureData) {
      return;
    }

    // Actualizar título si quieres
    if (this.miniatureData.course) {
      this.miniatureData = {
        ...this.miniatureData,
        course: {
          ...this.miniatureData.course,
          title: update.title
        }
      };
    }

    // Actualizar miniatura (añadir o quitar)
    if (update.miniatureUrl) {
      this.miniatureData = {
        ...this.miniatureData,
        miniature: {
          ...(this.miniatureData?.miniature ? { ...this.miniatureData.miniature } : { id: 0, course_id: update.id, created_at: new Date(), updated_at: new Date() }),
          url: update.miniatureUrl
        }
      };
    } else {
      // Si viene null => se eliminó la miniatura
      this.miniatureData = {
        ...this.miniatureData,
        miniature: null
      };
    }
  });
}

    isAdmin(): boolean {
      return this.authService.hasRole('admin');
    }
    private checkIfExternalCourse(): void {
  this.route.paramMap.subscribe((params: ParamMap) => {
    const courseId = params.get('id');

    if (courseId ) {
      this.hasExternalCourse = true;
      this.miniatureLoading = true;
      this.studioService.getMiniature(+courseId).subscribe({
          next: (res) => {
            this.miniatureData = res;
            this.miniatureLoading = false;
          },
          error: (err) => {
            console.error('Error al obtener la miniatura del curso', err);
          }
        });
    } else {
      this.hasExternalCourse = false;
    }
  });
}
    private checkIfExternalUser(): void {
  this.route.paramMap.subscribe((params: ParamMap) => {
    const username = params.get('username');

    if (username) {
      this.hasExternalUser = true;
      this.portfolioLoading = true;
      this.studioService.getPortfolioByUsername(username).subscribe({
        next: (res) => {
          this.portfolioData = res.portfolio;
          this.portfolioLoading = false;
        },
        error: (err) => {
          console.error('Error al obtener datos del portfolio externo', err);
        }
      });
    } else {
      this.hasExternalUser = false;
    }
  });
}

    /**
   * Configura la suscripción para eventos de navegación del router
   */
  private setupRouterSubscription(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Remove leading slash
        this.currentRoute = event.urlAfterRedirects.replace(/^\/+/, '');
      });
  }

  /**
   * Inicializa los datos del usuario
   */
  private initializeUserData(): void {
    this.datosUsuario$ = this.authService.currentUser;
  }

  /**
   * Inicializa la configuración del tema
   */
  private initializeTheme(): void {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.prefersDarkMode = this.themeService.getSystemPrefersDark();

    this.themeService.onSystemThemeChange((isDark) => {
      this.prefersDarkMode = isDark;
    });
  }

  /**
   * Configura los observadores de breakpoints para responsive design
   */
  private setupBreakpointObservers(): void {
    this.setupMobileBreakpoint();
    this.setupTabletBreakpoint();
  }

  /**
   * Configura el observador para dispositivos móviles
   */
  private setupMobileBreakpoint(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        takeUntil(this.destroy$)
      )
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        if (this.isMobile) {
          /* this.isSidebarCollapsed = true */;
        }
      });
  }

  /**
   * Configura el observador para tablets
   */
  private setupTabletBreakpoint(): void {
    this.breakpointObserver
      .observe([Breakpoints.Tablet])
      .pipe(
        map(result => result.matches),
        takeUntil(this.destroy$)
      )
      .subscribe(isTablet => {
        this.isTablet = isTablet;
        if (this.isTablet) {
          this.isSidebarCollapsed = true;
        }
      });
  }

  /**
   * Configura la suscripción para cuando la aplicación esté estable
   */
  private setupAppStabilitySubscription(): void {
    this.appRef.isStable
      .pipe(first(isStable => isStable === true))
      .subscribe(() => {
        this.renderer.removeClass(document.body, 'app-loading');
      });
  }
    navigateTo(path: string) {
      if(!this.hasExternalUser){
        this.router.navigate(['studio/'+path]);
      }else{
        this.router.navigate(['studio/@'+ this.portfolioData?.username+'/'+path]);
      }
      
    }
    
    navigatelearning(path: string) {
    this.router.navigate([path]);
  }
    navigateToEditor(path: string) {
      if(this.hasExternalCourse){
        this.router.navigate(['studio/'+this.miniatureData?.course?.id+'/' + path]);
      }
      
    }
    goBack(): void {
      
    if (!this.portfolioData) {
      this.router.navigate(['/studio/courses']);
      
    } else {
      this.router.navigate(['/studio/@'+ this.portfolioData?.username, 'courses']);
    }
  }
    switchTheme(theme: 'light' | 'dark' | 'system') {
      this.themeService.setTheme(theme);
      this.currentTheme = theme;
      
    }
    toggleSidebar() {
      if (this.isMobile === false && this.isTablet === false) {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
       
      } if (this.isMobile) {
        this.isSidebarClose = !this.isSidebarClose;
        this.isdrawer = !this.isdrawer;
        
      } else if (this.isTablet) {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        this.isdrawer = !this.isdrawer;
        
      }
  
    }
    /* closeSidebar() {
      this.isSidebarClose = ! this.isSidebarClose ;
      console.log(this.isSidebarClose)
    } */
    logoutAndRedirect(): void {
      this.authService.logout().subscribe({
        next: () => {
          if (this.platformId && typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
        },
        error: (err) => {
          console.error('Error cerrando sesión:', err);
        }
      });
    }
  
  
    isProfileMenuOpen = false;
  
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }
  
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-panel')) {
      this.isProfileMenuOpen = false;
    }
  }
  viewPortfolio() {

    if(this.hasExternalUser){
      this.router.navigate(['/learning/portfolio', '@'+ this.portfolioData?.username]);
    }else{

      this.datosUsuario$.subscribe((user) => {
      if (user) {
        this.router.navigate(['/learning/portfolio','@'+ user.username]);
      }
    });
    }
      
  }
  learningNavigateTo(path: string) {
    this.datosUsuario$.subscribe((user) => {
      if (user) {
        if(path === 'portfolio'){
          this.router.navigate(['/learning',path,'@'+ user.username]);
        }else if(path === 'profile'){
          this.router.navigate(['/learning',path]);
        }
        
      }
    });
  }

  goToCourse(course: any) {
    this.router.navigate([`learning/course/${course.title}/${course.id}`]);
  }
  private setupChapterRouteListener(): void {
  // Inicial
  this.syncChapterState();

  // Cada navegación
  this.router.events
    .pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    )
    .subscribe(() => this.syncChapterState());
}

private syncChapterState(): void {
  const params = this.collectAllParams(this.route);

  const courseId = this.toNum(params['id']);
  const moduleId = this.toNum(params['module']);
  const chapterId = this.toNum(params['chapter']);

  this.courseId = courseId ?? undefined;
  this.activeModuleId = moduleId;
  this.activeChapterId = chapterId;

  // ✅ estamos en capítulo si existen :module y :chapter
  this.isChapterRoute = moduleId != null && chapterId != null;

  // ✅ auto-abrir el módulo activo
  if (this.isChapterRoute && moduleId != null) {
    this.openModuleId = moduleId;
  }

  // ✅ cargar módulos solo cuando estamos en capítulo (y no los tengo cargados aún para ese curso)
  if (this.isChapterRoute && courseId != null && this.modulesLoadedForCourseId !== courseId) {
    this.loadModulesByCourse(courseId);
  }
}

private collectAllParams(route: ActivatedRoute): Record<string, any> {
  const out: Record<string, any> = {};
  let current: ActivatedRoute | null = route;
  while (current) {
    Object.assign(out, current.snapshot.params);
    current = current.firstChild;
  }
  return out;
}

private toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
private loadModulesByCourse(courseId: number): void {
  this.modulesLoading = true;
  this.modulesError = false;
  this.courseModules = [];
  this.modulesLoadedForCourseId = courseId;

  this.moduleService.getByCourse(courseId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.courseModules = res ?? [];
        this.modulesLoading = false;

        // asegura que el módulo activo quede abierto
        if (this.activeModuleId != null) {
          this.openModuleId = this.activeModuleId;
        }
      },
      error: (err) => {
        console.error('Error cargando módulos del curso', err);
        this.modulesLoading = false;
        this.modulesError = true;
      }
    });
}

reloadModules(): void {
  if (this.courseId != null) this.loadModulesByCourse(this.courseId);
}
toggle(moduleId: number): void {
  this.openModuleId = this.openModuleId === moduleId ? null : moduleId;
}

isOpen(moduleId: number): boolean {
  return this.openModuleId === moduleId;
}

isActiveChapter(chapterId: number): boolean {
  return this.activeChapterId === chapterId;
}

goToChapter(moduleId: number, chapterId: number): void {
  // navega a /studio/:id/module/:module/chapter/:chapter
  this.router.navigate(['./module', moduleId, 'chapter', chapterId], { relativeTo: this.route });

  // UX móvil/tablet: cerrar drawer al navegar
  if (this.isMobile) {
    this.isSidebarClose = true;
    this.isdrawer = false;
  }
}

trackByModule(_: number, m: ModuleResponse) { return m.id; }
trackByChapter(_: number, c: Chapters) { return c.id; }

  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

}
