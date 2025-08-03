import { ApplicationRef, Component, inject, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, Observable, Subject, tap } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntil, map, first} from 'rxjs/operators';
import { HostListener } from '@angular/core';
import { ThemeService } from '../../../../shared/UI/theme.service';
import { AuthService } from '../../../../core/api/auth/auth.service';
import { User } from '../../../../core/api/auth/auth.interfaces';

@Component({
  selector: 'app-panel.course',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './panel.course.component.html',
  styleUrl: './panel.course.component.css'
})
export class PanelCourseComponent {
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
  
  
    constructor(
      private themeService: ThemeService,
      @Inject(PLATFORM_ID) private platformId: Object,
      private router: Router,
      private authService: AuthService,
      private breakpointObserver: BreakpointObserver,
      private renderer: Renderer2,
      private appRef : ApplicationRef
    ) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          // Remove leading slash
          this.currentRoute = event.urlAfterRedirects.replace(/^\/+/, '');
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
      this.router.navigate(['/learning/portfolio', username]);
  }
}
