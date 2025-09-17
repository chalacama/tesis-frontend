import { CommonModule } from '@angular/common';
import {
  Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit,
  Output, ViewChild
} from '@angular/core';

import { UiDialogDirective } from '../../../directive/ui-dialog.directive';
import { ButtonComponent } from '../../button/button/button.component';
import { UiSeverity, UiSize, UiVariant, UiNeumorphism, UiStyleProps } from '../../../interfaces/ui-presets.interface';
import { UiButtonProps } from '../../../interfaces/ui-button.interface';

@Component({
  selector: 'ui-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
  hostDirectives: [{
    directive: UiDialogDirective,
    inputs: [
      'visible','type',
      'severity','size','disabled','neumorphism','variant',
      'ariaLabel','role','tabIndex','ariaPressed','title',
      'dialogClass','dialogStyle',
      'closeOnMaskClick','closeOnEsc',
      'mask','maskClass','maskStyle','maskType',
      'buttons','icons',
      // 👇 NUEVO para controlar la visibilidad de los botones en la máscara
      'visibleBnt'
    ],
    outputs: ['visibleChange']
  }]
})
export class DialogComponent implements OnInit, OnDestroy {

  constructor(public readonly dlg: UiDialogDirective) {}

  @Output() opened  = new EventEmitter<void>();
  @Output() closed  = new EventEmitter<void>();
  @Output() action  = new EventEmitter<string>(); // id del botón pulsado
  
  @ViewChild('panel', { static: false }) panelRef?: ElementRef<HTMLElement>;

  private lastFocused?: HTMLElement | null;

  // Estado de transformación para tipo 'image'
  rotateDeg = 0;
  scale = 1;

  ngOnInit(): void {
    if (this.dlg.visible) this.afterOpen();
  }

  ngOnDestroy(): void {
    if (this.dlg.visible) this.afterClose();
  }

  ngOnChanges(): void {
    if (this.dlg.visible) this.afterOpen();
    else this.afterClose();
  }
  requestClose() {
    this.action.emit('close');

    // cerrar de inmediato el estado interno
    (this.dlg as any).visible = false;

    // 👇 emitir el two-way desde la DIRECTIVA
    this.dlg.visibleChange.emit(false);

    // mantener tu ciclo de cierre (focus, evento, etc.)
    this.afterClose();
  }

  private afterOpen() {
    queueMicrotask(() => {
      this.lastFocused = document.activeElement as HTMLElement | null;
      this.panelRef?.nativeElement?.focus();
      this.opened.emit();
    });
  }

  private afterClose() {
    queueMicrotask(() => {
      this.lastFocused?.focus?.();
      this.closed.emit();
    });
  }

  // ===== Cierre por máscara / ESC =====
  onMaskClick() {
    if (!this.dlg.visible || !this.dlg.closeOnMaskClick) return;
    this.requestClose();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownDoc(ev: KeyboardEvent) {
    if (!this.dlg.visible) return;

    // ESC
    if (this.dlg.closeOnEsc && ev.key === 'Escape') {
      ev.stopPropagation();
      ev.preventDefault();
      this.requestClose();
      return;
    }

    // Atajos solo en modo imagen
    if (this.dlg.type === 'image') {
      if (ev.key === 'ArrowLeft') { this.rotate(-90); ev.preventDefault(); }
      if (ev.key === 'ArrowRight'){ this.rotate(+90); ev.preventDefault(); }
      if (ev.key === '0')         { this.resetTransform(); ev.preventDefault(); }
    }
  }

  /* requestClose() {
    this.action.emit('close');
    this.closed.emit();
  } */

  // ===== Estilos utilitarios =====
  hostClasses(): string[] {
    const v  = `v-${(this.dlg.variant as UiVariant) ?? 'filled'}`;
    const s  = `s-${(this.dlg.size as UiSize) ?? 'md'}`;
    const neu= `neu-${(this.dlg.neumorphism as UiNeumorphism) ?? 'flat'}`;
    const sev= `sev-${(this.dlg.severity as UiSeverity) ?? 'primary'}`;
    const t  = `t-${this.dlg.type ?? 'free'}`;
    const dis= this.dlg.disabled ? 'is-disabled' : '';
    const open = this.dlg.visible ? 'is-open' : 'is-closed';
    const extra = this.dlg.dialogClass ?? '';
    return ['ui-dialog', v, s, neu, sev, t, dis, open, extra].filter(Boolean);
  }

  maskClasses(): string[] {
    const mt = `mask-${(this.dlg as any).maskType ?? 'transparent'}`;
    const type = `t-${this.dlg.type ?? 'free'}`;
    const extra = (this.dlg as any).maskClass ?? '';
    return ['ui-dialog__mask', mt, type, this.dlg.visible ? 'is-open' : 'is-closed', extra].filter(Boolean);
  }

  styleMap(): Record<string, string> {
    const s = (this.dlg.dialogStyle ?? {}) as UiStyleProps;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(s)) if (v != null) out[k] = String(v);
    return out;
  }

  // ===== Botones (footer genérico si lo usas en free) =====
  onButtonClick(btn: UiButtonProps) {
    this.action.emit(btn.id ?? btn.label ?? 'button');
    if (btn.id === 'close' || btn.label?.toLowerCase() === 'cerrar') {
      this.requestClose();
    }
  }

  // ===== Rotación/Zoom en modo imagen =====
  rotate(delta: number) {
    if (this.dlg.type !== 'image') return;
    this.rotateDeg = (this.rotateDeg + delta) % 360;
    if (this.rotateDeg < 0) this.rotateDeg += 360;
  }
  resetTransform() {
    if (this.dlg.type !== 'image') return;
    this.rotateDeg = 0;
    this.scale = 1;
  }
  onWheel(e: WheelEvent) {
    if (this.dlg.type !== 'image') return;
    e.preventDefault();
    const step = 0.1;
    this.scale += (e.deltaY > 0 ? -step : step);
    this.scale = Math.min(4, Math.max(0.2, this.scale));
  }
  contentStyle(): Record<string,string> {
    return (this.dlg.type === 'image')
      ? { transform: `rotate(${this.rotateDeg}deg) scale(${this.scale})`, transformOrigin: 'center center' }
      : {};
  }

  // Helpers
  get showMaskButtons(): boolean {
    // visibleBnt === false -> oculta
    return (this.dlg as any).visibleBnt !== false && this.dlg.type === 'image';
  }
}
