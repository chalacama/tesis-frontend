import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  constructor(private router: Router) {}

  goToAuth() {
    this.router.navigate(['/auth']);
  }

  // --- MÉTODO NUEVO ---
  /**
   * Maneja el clic en el botón "Explora".
   * Previene el salto del ancla HTML y usa la API de scroll de JS
   * para un desplazamiento suave.
   */
  scrollToSobre(event: Event): void {
    // 1. Prevenimos el comportamiento por defecto del enlace (el "salto" que parpadea)
    event.preventDefault();

    // 2. Buscamos el elemento de destino por su ID
    const element = document.getElementById('sobre');

    // 3. Si existe, nos desplazamos suavemente hacia él
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  // --- FIN DEL MÉTODO NUEVO ---

}