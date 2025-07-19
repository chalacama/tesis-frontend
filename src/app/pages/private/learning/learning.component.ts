import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../shared/UI/theme.service';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common'
/* import { Router } from 'express'; */
import { filter } from 'rxjs';
/* import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators'; */
@Component({
  selector: 'app-learning',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './learning.component.html',
  styleUrl: './learning.component.css'
})
export class LearningComponent {
  currentTheme: 'light' | 'dark' | 'system' = 'system';
  currentRoute: string = '';
  isSidebarCollapsed = false;
  prefersDarkMode: boolean = false;
  constructor(private themeService: ThemeService, @Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Remove leading slash
        this.currentRoute = event.urlAfterRedirects.replace(/^\/+/, '');
      });
  }

  ngOnInit() {

    this.currentTheme = this.themeService.getCurrentTheme();
    this.prefersDarkMode = this.themeService.getSystemPrefersDark();

    this.themeService.onSystemThemeChange((isDark) => {
      this.prefersDarkMode = isDark;
    });
    /* if (this.currentTheme, this.prefersDarkMode) {
      const splash = document.getElementById('splash-screen');
      splash?.remove();
    } */

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
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}
