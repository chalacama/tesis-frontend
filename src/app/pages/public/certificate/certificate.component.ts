import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CertificateService } from '../../../core/api/certificate/certificate.service';
import { CertificateView } from '../../../core/api/certificate/certificate.interface';

import { of } from 'rxjs';
import { switchMap } from 'rxjs';

// 👇 imports para PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.css'
})
export class CertificateComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly certificateService = inject(CertificateService);

  loading = signal(true);
  downloading = signal(false);
  error = signal<string | null>(null);
  certificate = signal<CertificateView | null>(null);

  // 👉 referencia al elemento del certificado
  @ViewChild('certificateCard', { static: false })
  certificateCard!: ElementRef<HTMLElement>;

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
        next: (resp) => {
          if (resp) {
            this.certificate.set(resp.data);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el certificado del codigo ' + this.route.snapshot.paramMap.get('code'));
          this.loading.set(false);
        }
      });
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

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,

      onclone: (clonedDoc: Document) => {
        // Fondo verde suave del cuerpo del certificado
        const body = clonedDoc.querySelector<HTMLElement>('.certificate-body');
        if (body) {
          body.style.background = '#E6F7F1'; // verde menta similar al original
          body.style.backgroundImage = 'none';
        }

        // Tarjetas de persona (estudiante / tutor)
        clonedDoc.querySelectorAll<HTMLElement>('.person-card').forEach(el => {
          el.style.background = '#FFFFFF';  // blanco tarjeta
        });

        // Tags (Beginner / Programación / Tecnología)
        clonedDoc.querySelectorAll<HTMLElement>('.tag').forEach(el => {
          if (el.classList.contains('difficulty')) {
            // dificultad: verde suave
            el.style.background = '#DCFCE7';
          } else {
            // categorías: gris/azul muy claro
            el.style.background = '#E5F0FF';
          }
        });

        // Mensajes de error (por si acaso)
        clonedDoc.querySelectorAll<HTMLElement>('.certificate-error').forEach(el => {
          el.style.background = '#FEF2F2';
          el.style.borderColor = '#FCA5A5';
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

  // ==== NUEVOS MÉTODOS PARA AVATARES / LOGO ====

  getStudentAvatar(cert: CertificateView | null): string | null {
    if (!cert?.certificate_owner?.profile_picture_url) return null;
    return this.certificateService.getProxiedImage(
      cert.certificate_owner.profile_picture_url
    );
  }

  getTutorAvatar(cert: CertificateView | null): string | null {
    if (!cert?.course_owner?.profile_picture_url) return null;
    return this.certificateService.getProxiedImage(
      cert.course_owner.profile_picture_url
    );
  }

  getCareerLogo(cert: CertificateView | null): string | null {
    if (!cert?.academic_information?.career?.url_logo) return null;
    return this.certificateService.getProxiedImage(
      cert.academic_information.career.url_logo
    );
  }


}
