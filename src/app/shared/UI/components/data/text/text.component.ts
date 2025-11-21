import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../button/icon/icon.component';
import { DialogComponent } from '../../overlay/dialog/dialog.component';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [CommonModule, IconComponent, DialogComponent],
  templateUrl: './text.component.html',
  styleUrl: './text.component.css',
})
export class TextComponent implements OnChanges, AfterViewInit {
  /**
   * Texto largo de descripción. Puede venir con etiquetas <a href="...">...</a>
   */
  @Input() description: string = '';

  /**
   * Título opcional del cuadro de diálogo
   */
  @Input() title: string = 'Descripción';

  /**
   * Mostrar un pequeño preview al lado del botón
   */
  @Input() showPreview: boolean = true;

  /**
   * Mostrar texto "Ver descripción" junto al ícono
   */
  @Input() showLabel: boolean = true;

  dialogTextShow = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    // esperemos al próximo ciclo para que innerHTML ya esté pintado
    setTimeout(() => this.setupLinks(), 0);
  }

  ngAfterViewInit(): void {
    this.setupLinks();
  }

  openDialog(): void {
    this.dialogTextShow = true;
    // aseguramos que cuando se abre el diálogo, los links tengan target/_blank
    setTimeout(() => this.setupLinks(), 0);
  }

  /**
   * Fuerza que todos los <a> de la descripción abran en nueva pestaña
   * y tengan una clase para estilos (color azul, etc.).
   */
  private setupLinks(): void {
    const root = this.host.nativeElement;
    const anchors = root.querySelectorAll<HTMLAnchorElement>(
      '.description-content a, .description-preview a'
    );

    anchors.forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.classList.add('description-link');
    });
  }
}
