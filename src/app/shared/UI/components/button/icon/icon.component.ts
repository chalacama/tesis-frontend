import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiIconDirective } from '../../../directive/ui-icon.directive';

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  hostDirectives: [{
    directive: UiIconDirective,
    // Re-exporta inputs para poder usarlos directamente en <ui-icon ...>
    inputs: ['svgPath', 'severity', 'size', 'iconClass', 'iconStyle', 'ariaLabel', 'role']
  }]
})
export class IconComponent implements OnChanges {

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  constructor(public readonly iconDir: UiIconDirective) {
    /* this.ngOnChanges(); */
  }

  // Proxy opcional: permite pasar [svgPath] directo al componente
  @Input() set svgPath(val: string | undefined) {
    this.iconDir.svgPath = val;
  }

  safeSvg?: SafeHtml;

  ngOnChanges(): void {
    const path = this.iconDir.svgPath;
    if (!path) { this.safeSvg = undefined; return; }

    this.http.get(path, { responseType: 'text' }).subscribe({
      next: raw => {
        // limpiamos width/height para que use --icon-size
        let svg = raw.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
        // hereda color desde CSS
        if (!/fill="/i.test(svg)) svg = svg.replace('<svg', '<svg fill="currentColor"');
        // aseguramos que el SVG no “colapse” si no tiene viewBox (opcional):
        // if (!/viewBox="/i.test(svg)) svg = svg.replace('<svg', '<svg viewBox="0 0 24 24"');
        this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      },
      error: _ => { this.safeSvg = undefined; }
    });
  }
   /* ngOnChanges(): void {
    if (this.iconDir?.svgPath) {
      this.http.get(this.iconDir?.svgPath, { responseType: 'text' }).subscribe(raw => {
        let svg = raw.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
        if (!/fill="/i.test(svg)) svg = svg.replace('<svg', '<svg fill="currentColor"');
        this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      });
    } else {
      this.safeSvg = undefined;
    }
   
  } */

  cssMap(): Record<string, string> {
    // mergeamos las variables de la directiva + iconStyle opcional
    const vars = this.iconDir.cssVars();
    const style = (this.iconDir.iconStyle ?? {}) as Record<string, string>;
    return { ...vars, ...style };
  }

  hostAttrs() {
    return {
      role: this.iconDir.role ?? 'img',
      ariaLabel: this.iconDir.ariaLabel ?? null
    };
  }
}
