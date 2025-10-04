import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input } from '@angular/core';
import { UiToastService } from '../../../../services/ui-toast.service';
import { UiToastProps } from '../../../interfaces/ui-toast.interface';
import { IconComponent } from '../../button/icon/icon.component';


@Component({
  selector: 'ui-toast',
  standalone: true,
  imports: [CommonModule , IconComponent],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  host: {
    'aria-live': 'polite',
    'aria-relevant': 'additions',
  }
})
export class ToastComponent {
  private toastService = inject(UiToastService);

  /** Posición global del contenedor (por defecto top-right). 
   *  Si agregas toasts con posiciones distintas, el componente 
   *  renderiza un contenedor por posición automáticamente. */
  position = input<UiToastProps['position']>('top-right');

  /** Máximo de toasts visibles por contenedor (0 = ilimitado) */
  max = input<number>(5);

  // Agrupar por posición para soportar múltiples contenedores
  readonly groups = computed(() => {
    const list = this.toastService.messages();
    const map = new Map<string, typeof list>();
    for (const m of list) {
      const key = m.position ?? 'top-right';
      if (!map.has(key)) map.set(key, []);
      (map.get(key) as any).push(m);
    }
    // limitar por contenedor
    if (this.max() && this.max()! > 0) {
      for (const [k, v] of map) map.set(k, v.slice(-this.max()!));
    }
    return Array.from(map.entries()); // [ [position, msgs[]], ... ]
  });

  remove(id: number) {
    this.toastService.remove(id);
  }

  // Para soporte SR (screen reader) con live region
  constructor() {
    effect(() => { this.toastService.messages(); /* disparar ARIA live */ });
  }
}

