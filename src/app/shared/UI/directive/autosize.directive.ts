import { Directive, ElementRef, HostListener, AfterViewInit, Input, inject } from '@angular/core';

@Directive({
  selector: 'textarea[autosize]',
  standalone: true
})
export class AutosizeDirective implements AfterViewInit {
  private el = inject(ElementRef<HTMLTextAreaElement>);
  @Input() maxHeight?: number;   // opcional: límite de crecimiento (px)
  @Input() minHeight?: number;   // opcional: alto mínimo (px)

  ngAfterViewInit() {
    const ta = this.el.nativeElement;
    ta.style.overflow = 'hidden';
    ta.style.resize = 'none';
    if (this.minHeight) ta.style.minHeight = `${this.minHeight}px`;
    this.resize();
  }

  @HostListener('input')
  onInput() { this.resize(); }

  private resize() {
    const ta = this.el.nativeElement;
    ta.style.height = 'auto';
    const target = this.maxHeight ? Math.min(ta.scrollHeight, this.maxHeight) : ta.scrollHeight;
    ta.style.height = `${target}px`;
    // si supera el max, permite scroll vertical
    ta.style.overflowY = this.maxHeight && ta.scrollHeight > this.maxHeight ? 'auto' : 'hidden';
  }
}
