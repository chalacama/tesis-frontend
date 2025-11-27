import { ApplicationRef, Component, inject, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
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

@Component({
  selector: 'app-studio',
  imports: [RouterOutlet, CommonModule , PreviewComponent,ButtonComponent, AvatarComponent , SearchComponent , NotificationComponent , ExploreComponent],
  templateUrl: './studio.component.html',
  styleUrl: './studio.component.css'
})
export class StudioComponent implements OnInit {

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
    ) {
      this.setupRouterSubscription();
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
    }
    isAdmin(): boolean {
      return this.authService.hasRole('admin');
    }
    private checkIfExternalCourse(): void {
  this.route.paramMap.subscribe((params: ParamMap) => {
    const courseId = params.get('id');

    if (courseId ) {
      this.hasExternalCourse = true;

      this.studioService.getMiniature(+courseId).subscribe({
          next: (res) => {
            this.miniatureData = res;
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

      this.studioService.getPortfolioByUsername(username).subscribe({
        next: (res) => {
          this.portfolioData = res.portfolio;
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
   
}
