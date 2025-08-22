import { Injectable, RendererFactory2, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer!: Renderer2;
  private currentTheme: 'light' | 'dark' | 'system';
  private isBrowser: boolean;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.renderer = rendererFactory.createRenderer(null, null);
      this.currentTheme = this.loadThemeFromStorage();
      this.initializeTheme();
    } else {
      this.currentTheme = 'system'; // fallback SSR
    }
  }

  private initializeTheme(): void {
    if (!this.isBrowser) return;

    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    colorSchemeQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applySystemTheme();
      }
    });

    this.applyTheme(this.currentTheme);
  }

  private loadThemeFromStorage(): 'light' | 'dark' | 'system' {
    if (!this.isBrowser) return 'system';
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    return savedTheme || 'system';
  }

  private saveThemeToStorage(theme: 'light' | 'dark' | 'system'): void {
    if (!this.isBrowser) return;
    localStorage.setItem('theme', theme);
  }

  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    if (!this.isBrowser) return;

    this.currentTheme = theme;
    this.saveThemeToStorage(theme);

    if (theme === 'system') {
      this.applySystemTheme();
    } else {
      this.renderer.setStyle(document.documentElement, 'color-scheme', theme);
    }
  }

  private applySystemTheme(): void {
    if (!this.isBrowser) return;
    this.renderer.removeStyle(document.documentElement, 'color-scheme');
  }

  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.applyTheme(theme);
  }

  getCurrentTheme(): 'light' | 'dark' | 'system' {
    return this.currentTheme;
  }

  getSystemPrefersDark(): boolean {
    return this.isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  onSystemThemeChange(callback: (prefersDark: boolean) => void): void {
    if (!this.isBrowser) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (event) => {
      callback(event.matches);
    });
  }
}
