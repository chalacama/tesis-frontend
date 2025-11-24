// src/app/pages/private/personalize/personalize.component.ts

import { isPlatformBrowser, NgIf, NgFor } from '@angular/common';
import {
  ApplicationRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { first } from 'rxjs';

import { AuthService } from '../../../core/api/auth/auth.service';
import { User } from '../../../core/api/auth/auth.interfaces';

interface PersonalizeStep {
  key: 'info' | 'education' | 'interest';
  label: string;
  route: 'infomation' | 'education' | 'interest'; // ojo con 'infomation'
  completed: boolean;
}

@Component({
  selector: 'app-personalize',
  standalone: true,
  imports: [RouterOutlet, NgIf, NgFor],
  templateUrl: './personalize.component.html',
  styleUrl: './personalize.component.css'
})
export class PersonalizeComponent implements OnInit {

  steps: PersonalizeStep[] = [];
  activeStepIndex = 0;
  isLoadingUser = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appRef: ApplicationRef,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Quitar pantalla de carga cuando la app está estable (SSR + hydration)
    if (isPlatformBrowser(this.platformId)) {
      this.appRef.isStable
        .pipe(first(isStable => isStable === true))
        .subscribe(() => {
          document.body.classList.remove('app-loading');
        });
    }

    // Obtener el usuario actual y decidir a qué paso lo mandamos
    this.authService.currentUser
      .pipe(first())
      .subscribe(user => {
        this.isLoadingUser = false;
        console.log('Usuario actual en PersonalizeComponent:', user);

        // Si por alguna razón no hay usuario, lo sacamos de aquí
        if (!user) {
          this.router.navigate(['/auth']);
          return;
        }

        this.configureStepsFromUser(user);
        this.ensureCorrectChildRoute();
      });
  }

  /**
   * Configura el stepper en base a los flags del usuario.
   */
  private configureStepsFromUser(user: User): void {
    const hasUserInfo = !!user.has_user_information;
    const hasEducational = !!user.has_educational_user;
    const hasInterest = !!user.has_user_category_interest;

    this.steps = [
      {
        key: 'info',
        label: 'Información personal',
        route: 'infomation', // coincide con la ruta definida en el router
        completed: hasUserInfo
      },
      {
        key: 'education',
        label: 'Información educativa',
        route: 'education',
        completed: hasEducational
      },
      {
        key: 'interest',
        label: 'Intereses',
        route: 'interest',
        completed: hasInterest
      }
    ];

    // Determinar el próximo paso pendiente
    if (!hasUserInfo) {
      this.activeStepIndex = 0;
    } else if (!hasEducational) {
      this.activeStepIndex = 1;
    } else if (!hasInterest) {
      this.activeStepIndex = 2;
    } else {
      // Todo completado → lo dejamos en el último paso
      this.activeStepIndex = 2;
    }
  }

  /**
   * Fuerza que la URL hija coincida con el paso que le corresponde al usuario.
   * Evita que abra directamente /personalize/education o /interest
   * sin haber completado los pasos anteriores.
   */
  private ensureCorrectChildRoute(): void {
    const desiredRoute = this.steps[this.activeStepIndex]?.route;

    if (!desiredRoute) {
      return;
    }

    const child = this.route.firstChild;
    const currentChildPath = child?.snapshot.routeConfig?.path;

    // Si ya está en la ruta correcta, no hacemos nada
    if (currentChildPath === desiredRoute) {
      return;
    }

    // Navegar al paso correcto
    this.router.navigate([desiredRoute], {
      relativeTo: this.route,
      replaceUrl: true
    });
  }

  /**
   * Pensado para el futuro:
   * Los componentes hijos pueden llamar a este método cuando terminen su paso
   * para avanzar de forma automática SIN permitir ir hacia atrás/adelante a mano.
   *
   * Ejemplo de uso futuro desde un hijo:
   *   this.parent.onStepCompleted('info');
   */
  onStepCompleted(stepKey: 'info' | 'education' | 'interest'): void {
    const idx = this.steps.findIndex(s => s.key === stepKey);
    if (idx !== -1) {
      this.steps[idx].completed = true;
    }

    if (stepKey === 'info' && this.steps[1]) {
      this.activeStepIndex = 1;
    } else if (stepKey === 'education' && this.steps[2]) {
      this.activeStepIndex = 2;
    } else {
      // Si ya es el último paso, aquí luego podrías redirigir a dashboard, etc.
      return;
    }

    const nextStep = this.steps[this.activeStepIndex];
    if (nextStep) {
      this.router.navigate([nextStep.route], {
        relativeTo: this.route,
        replaceUrl: true
      });
    }
  }
}
