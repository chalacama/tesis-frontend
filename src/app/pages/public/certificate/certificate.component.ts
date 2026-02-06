// import { CommonModule, DOCUMENT, Location } from '@angular/common';
import { CommonModule, Location, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CertificateService } from '../../../core/api/certificate/certificate.service';
import { CertificateView } from '../../../core/api/certificate/certificate.interface';

import { of, switchMap } from 'rxjs';




// 👇 imports para PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 👇 QR
import QRCode from 'qrcode';
import { computed } from '@angular/core';
import { ThemeService } from '../../../shared/services/theme.service';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.css'
})
export class CertificateComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);

  private readonly certificateService = inject(CertificateService);

  loading = signal(true);
  downloading = signal(false);
  error = signal<string | null>(null);
  certificate = signal<CertificateView | null>(null);

  // ✅ verificación
  verificationUrl = signal<string | null>(null);
  qrDataUrl = signal<string | null>(null);

  // 👉 referencia al elemento del certificado
  @ViewChild('certificateCard', { static: false })
  certificateCard!: ElementRef<HTMLElement>;

  private readonly themeService = inject(ThemeService);

currentTheme = signal<'light' | 'dark' | 'system'>('system');
prefersDarkMode = signal(false);
private readonly platformId = inject(PLATFORM_ID);
private readonly isBrowser = isPlatformBrowser(this.platformId);

effectiveTheme = computed<'light' | 'dark'>(() => {
  const t = this.currentTheme();
  return t === 'system'
    ? (this.prefersDarkMode() ? 'dark' : 'light')
    : t;
});

  ngOnInit(): void {
    

    this.route.paramMap
      .pipe(
        switchMap(params => {
          const code = params.get('code');
          if (!code) {
            this.error.set('No se proporcionó el código del certificado.');
            this.loading.set(false);
            return of(null);
          }

          this.loading.set(true);
          this.error.set(null);

          return this.certificateService.show(code);
        })
      )
      .subscribe({
        next: async (resp) => {
          if (resp) {
            const cert = resp.data;
            this.certificate.set(cert);

            // ✅ construir URL y QR con el code real del certificado
            const code = cert?.certificate?.code;
            if (code) {
              await this.buildVerificationQr(code);
            }
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el certificado del codigo ' + this.route.snapshot.paramMap.get('code'));
          this.loading.set(false);
        }
      });
      this.currentTheme.set(this.themeService.getCurrentTheme());
      this.prefersDarkMode.set(this.themeService.getSystemPrefersDark());

      this.themeService.onSystemThemeChange((isDark) => {
      this.prefersDarkMode.set(isDark);
    });
  }
  toggleTheme(): void {
  const next = this.effectiveTheme() === 'dark' ? 'light' : 'dark';
  this.themeService.setTheme(next);     // prioridad usuario: fuerza light/dark
  this.currentTheme.set(next);
}

  // ✅ URL ABSOLUTA dinámica (respeta baseHref del build)
  private buildVerificationUrl(code: string): string {
  const tree = this.router.createUrlTree(['/certificate', code]);
  const internalUrl = this.router.serializeUrl(tree);                // "/certificate/ABC"
  const withBaseHref = this.location.prepareExternalUrl(internalUrl); // "/<base>/certificate/ABC"

  // ✅ Browser: URL absoluta real (prod/dev) sin usar document.baseURI
  if (this.isBrowser && typeof window !== 'undefined') {
    return `${window.location.origin}${withBaseHref}`;
  }

  // ✅ SSR/Pre-render: devuelve relativa (y NO genera QR)
  return withBaseHref;
}

  private async buildVerificationQr(code: string): Promise<void> {
    if (!this.isBrowser) return; // ✅ evita NotYetImplemented en SSR/pre-render
    try {
      const url = this.buildVerificationUrl(code);
      this.verificationUrl.set(url);

      const dataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 140 // tamaño controlado para que encaje perfecto en el certificado
      });

      this.qrDataUrl.set(dataUrl);
    } catch (e) {
      console.error('QR error:', e);
      this.qrDataUrl.set(null);
      this.verificationUrl.set(null);
    }
  }

  getStudentFullName(): string {
    const cert = this.certificate();
    if (!cert || !cert.certificate_owner) return '';
    return `${cert.certificate_owner.name} ${cert.certificate_owner.lastname}`;
  }

  getTutorFullName(): string {
    const cert = this.certificate();
    if (!cert || !cert.course_owner) return '';
    return `${cert.course_owner.name} ${cert.course_owner.lastname}`;
  }

  async onDownload(): Promise<void> {
    const cert = this.certificate();

    if (!cert || !cert.can_download || this.downloading()) {
      return;
    }

    const code = cert.certificate.code;
    this.downloading.set(true);
    this.error.set(null);

    try {
      const element = this.certificateCard?.nativeElement;
      if (!element) {
        throw new Error('No se encontró el certificado en pantalla.');
      }
      const theme = this.effectiveTheme(); // 'light' | 'dark'

const palette = theme === 'dark'
  ? {
      bodyBg: '#0B1B17',
      personBg: '#0F2621',
      tagDifficultyBg: '#064E3B',
      tagCategoryBg: '#0B2239',
      errorBg: '#2B0B0B',
      errorBorder: '#7F1D1D',
      tagText: '#E5E7EB'
    }
  : {
      bodyBg: '#E6F7F1',
      personBg: '#FFFFFF',
      tagDifficultyBg: '#DCFCE7',
      tagCategoryBg: '#E5F0FF',
      errorBg: '#FEF2F2',
      errorBorder: '#FCA5A5',
      tagText: '' // deja que tome el color normal
    };

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,

        onclone: (clonedDoc: Document) => {
  const body = clonedDoc.querySelector<HTMLElement>('.certificate-body');
  if (body) {
    body.style.background = palette.bodyBg;
    body.style.backgroundImage = 'none';
  }

  clonedDoc.querySelectorAll<HTMLElement>('.person-card').forEach(el => {
    el.style.background = palette.personBg;
  });

  clonedDoc.querySelectorAll<HTMLElement>('.tag').forEach(el => {
    if (el.classList.contains('difficulty')) {
      el.style.background = palette.tagDifficultyBg;
    } else {
      el.style.background = palette.tagCategoryBg;
    }

    if (palette.tagText) el.style.color = palette.tagText;
  });

  clonedDoc.querySelectorAll<HTMLElement>('.certificate-error').forEach(el => {
    el.style.background = palette.errorBg;
    el.style.borderColor = palette.errorBorder;
  });
}

      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const pdfWidth = imgWidth * ratio;
      const pdfHeight = imgHeight * ratio;

      const marginX = (pageWidth - pdfWidth) / 2;
      const marginY = (pageHeight - pdfHeight) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, pdfWidth, pdfHeight);

      const fileName = `certificado-${code}.pdf`;
      pdf.save(fileName);

    } catch (err) {
      console.error(err);
      this.error.set('No se pudo generar el PDF del certificado.');
    } finally {
      this.downloading.set(false);
    }
  }

  // ==== AVATARES / LOGO ====

  getStudentAvatar(cert: CertificateView | null): string | null {
    if (!cert?.certificate_owner?.profile_picture_url) return null;
    return this.certificateService.getProxiedImage(cert.certificate_owner.profile_picture_url);
  }

  getTutorAvatar(cert: CertificateView | null): string | null {
    if (!cert?.course_owner?.profile_picture_url) return null;
    return this.certificateService.getProxiedImage(cert.course_owner.profile_picture_url);
  }

  getCareerLogo(cert: CertificateView | null): string | null {
    if (!cert?.academic_information?.career?.url_logo) return null;
    return this.certificateService.getProxiedImage(cert.academic_information.career.url_logo);
  }
}