import { Directive, ElementRef, AfterViewInit, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'textarea[autosize]',
  standalone: true
})
export class AutosizeDirective implements AfterViewInit {
  @Input('autosizeMinRows') minRows = 1;
  @Input('autosizeMaxRows') maxRows?: number;

  private get el(): HTMLTextAreaElement {
    return this.ref.nativeElement;
  }

  constructor(private ref: ElementRef<HTMLTextAreaElement>) {}

  ngAfterViewInit(): void {
    this.setup();
    this.resize();
    // Recalcula después del binding inicial ([value])
    queueMicrotask(() => this.resize());
  }

  private setup() {
    const s = this.el.style;
    s.overflowY = 'hidden';
    s.resize = 'none';
    this.el.rows = this.minRows;
  }

  @HostListener('input')
  onInput() { this.resize(); }

  @HostListener('window:resize')
  onWindowResize() { this.resize(); }

  private resize() {
    const ta = this.el;

    ta.style.height = 'auto';

    const lineHeight = this.getLineHeight(ta);
    let newHeight = ta.scrollHeight;

    if (this.maxRows && lineHeight) {
      const maxHeight = this.maxRows * lineHeight + this.getVerticalPads(ta);
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        ta.style.overflowY = 'auto';
      } else {
        ta.style.overflowY = 'hidden';
      }
    } else {
      ta.style.overflowY = 'hidden';
    }

    ta.style.height = `${newHeight}px`;
  }

  private getLineHeight(el: HTMLElement): number {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    if (!Number.isNaN(lh)) return lh;
    const fs = parseFloat(cs.fontSize) || 16;
    return fs * 1.2; // fallback
  }

  private getVerticalPads(el: HTMLElement): number {
    const cs = getComputedStyle(el);
    return (
      parseFloat(cs.paddingTop) +
      parseFloat(cs.paddingBottom) +
      parseFloat(cs.borderTopWidth) +
      parseFloat(cs.borderBottomWidth)
    );
  }
}
