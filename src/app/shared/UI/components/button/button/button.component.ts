import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

type BtnVariant = 'raised' | 'outlined' | 'text' | 'flat';
type BtnColor =
  | 'primary' | 'secondary' | 'info' | 'warn' | 'help' | 'danger' | 'contrast';

type BtnSize = 'sm' | 'md' | 'lg';
@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  @Input() label = '';
  @Input() variant: BtnVariant = 'raised';
  @Input() color: BtnColor = 'primary';
  @Input() size: BtnSize = 'md';
  @Input() disabled = false;
  @Input() iconOnly = false;

  /** Tamaños y estilos dinámicos */
  @Input() width: string = '40px';
  @Input() height: string = '40px';
  @Input() borderRadius: string = '10px';
  @Input() fontSize: string = '';
  @Input() iconSize: string = '10px';

  /** SVG */
  @Input() svgPath?: string;
  safeSvg?: SafeHtml;

  /** Badge */
  @Input() badge?: string | number;
  @Input() badgeColor: string = '#e53935';
  @Input() badgeTextColor: string = '#fff';

  ngOnChanges() {
  if (this.svgPath) {
    this.http.get(this.svgPath, { responseType: 'text' }).subscribe(raw => {
      // elimina width/height hardcodeados
      let svg = raw
        .replace(/\swidth="[^"]*"/i, '')
        .replace(/\sheight="[^"]*"/i, '');

      // asegura fill heredado (si no lo trae)
      if (!/fill="/i.test(svg)) {
        svg = svg.replace('<svg', '<svg fill="currentColor"');
      }

      this.safeSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
    });
  }
}


  cssVars() {
    const vars: Record<string, string> = {
      '--btn-width': this.width,
      '--btn-height': this.height,
      '--btn-radius': this.borderRadius,
      '--btn-icon-size': this.iconSize,
      '--btn-badge-bg': this.badgeColor,
      '--btn-badge-text': this.badgeTextColor,
      '--btn-font-size': this.fontSize,
    };
    /* if (this.fontSize) vars['--btn-font-size'] = this.fontSize; */
    return vars;
  }
}
