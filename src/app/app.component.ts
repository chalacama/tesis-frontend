import { ApplicationRef, Component, Inject, PLATFORM_ID, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { first } from 'rxjs';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'DigiMentor';
  
    constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appRef: ApplicationRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Solo queremos ejecutar esto en el navegador, no en el servidor.
    if (isPlatformBrowser(this.platformId)) {
      // 'isStable' emite `true` cuando la app está lista y la navegación inicial ha terminado.
      this.appRef.isStable.pipe(
        // Nos aseguramos de que solo se ejecute una vez.
        first(isStable => isStable === true)
      ).subscribe(() => {
        // Una vez estable, usamos el Renderer2 para quitar la clase del body.
        // Usar Renderer2 es más seguro para SSR que el acceso directo al DOM.
        this.renderer.removeClass(document.body, 'app-loading');
      });
    }
  }
}
