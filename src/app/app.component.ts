import { ApplicationRef, Component, Inject, OnInit, PLATFORM_ID, Renderer2 } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter, first } from 'rxjs';
import { UploadWidgetComponent } from './shared/UI/components/data/upload-widget/upload-widget.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, UploadWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'DigiMentor';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Se dispara en cuanto Angular completa la primera navegación.
      // Mucho más rápido que appRef.isStable, que espera a que
      // echarts, social login y todos los observables terminen.
      this.router.events.pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        first()
      ).subscribe(() => {
        this.renderer.removeClass(document.body, 'app-loading');
      });
    }
  }
}