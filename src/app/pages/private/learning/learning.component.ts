import { ApplicationRef, Component, inject, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../shared/services/theme.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, Observable, Subject, tap } from 'rxjs';
import { AuthService } from '../../../core/api/auth/auth.service';
import { User } from '../../../core/api/auth/auth.interfaces';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntil, map, first} from 'rxjs/operators';
import { HostListener } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchComponent } from '../../../shared/UI/components/data/search/search.component';
import { NotificationComponent } from '../../../shared/UI/components/data/notification/notification.component';
import { AvatarComponent } from '../../../shared/UI/components/media/avatar/avatar.component';
import { ExploreComponent } from '../../../shared/UI/components/data/explore/explore.component';
@Component({
  selector: 'app-learning',
  imports: [RouterOutlet, CommonModule, 

    SearchComponent, NotificationComponent , AvatarComponent, ExploreComponent
  ],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {
  datosUsuario$!: Observable<User | null>;
  currentTheme: 'light' | 'dark' | 'system' = 'system';
  currentRoute: string = '';
  isSidebarCollapsed = false;
  isSidebarClose = true;
  prefersDarkMode: boolean = false;
  isdrawer = false;
  isMobile = false;
  isTablet = false;
  private destroy$ = new Subject<void>();
private readonly route = inject(ActivatedRoute);

  constructor(
    private themeService: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver,
    private renderer: Renderer2,
    private appRef : ApplicationRef
  ) {
    // this.router.events
    //   .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    //   .subscribe((event: NavigationEnd) => {
    //     // Remove leading slash
    //     this.currentRoute = event.urlAfterRedirects.replace(/^\/+/, '');
    //   });
    this.router.events
  .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
  .subscribe((event: NavigationEnd) => {
    this.currentRoute = event.urlAfterRedirects.replace(/^\/+/, '');

    // Solo caso especial: si entras a un curso, lo colapsas
    if (this.currentRoute.startsWith('learning/course/')) {
      this.isSidebarCollapsed = true;
    }
    // Caso contrario: NO toques isSidebarCollapsed,
    // deja que se quede como lo dejó el usuario.
  });

  }

  
  ngOnInit() {
    

    
    

    this.datosUsuario$ = this.authService.currentUser;
    this.currentTheme = this.themeService.getCurrentTheme();
    this.prefersDarkMode = this.themeService.getSystemPrefersDark();

    this.themeService.onSystemThemeChange((isDark) => {
      this.prefersDarkMode = isDark;
    });
    

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
    
    this.appRef.isStable
  .pipe(first(isStable => isStable === true))
  .subscribe(() => {
    this.renderer.removeClass(document.body, 'app-loading');
  });
  

  }
  navigateTo(path: string) {
    
    this.router.navigate([path]);
  }
  switchTheme(theme: 'light' | 'dark' | 'system') {
    this.themeService.setTheme(theme);
    this.currentTheme = theme;
    console.log('Theme switched to:', this.currentTheme);
  }
  toggleSidebar() {
    if (this.isMobile === false && this.isTablet === false) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      console.log('pc');
    } if (this.isMobile) {
      this.isSidebarClose = !this.isSidebarClose;
      this.isdrawer = !this.isdrawer;
      console.log('Movil');
    } else if (this.isTablet) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      this.isdrawer = !this.isdrawer;
      console.log('Tablet');
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
viewPortfolio(username: string) {
    this.router.navigate(['/learning/portfolio/@'+username]);
}

myPortfolio() {
    this.datosUsuario$.subscribe((user) => {
      if (user) {
        this.router.navigate(['/learning/portfolio','@'+ user.username]);
      }
    });
  }
  
  isTutor(): boolean {
    return this.authService.hasRole('tutor') || this.authService.hasRole('admin');
  }



}
