import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CertificateService } from '../../../../core/api/certificate/certificate.service';
import { CertificateView } from '../../../../core/api/certificate/certificate.interface';

import { of } from 'rxjs';
import { switchMap } from 'rxjs';

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
          this.error.set('No se pudo cargar el certificado del codigo' + this.route.snapshot.paramMap.get('code'));
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

  onDownload(): void {
    const cert = this.certificate();

    if (!cert || !cert.can_download || this.downloading()) {
      return;
    }

    const code = cert.certificate.code;
    this.downloading.set(true);
    this.error.set(null);

    
  }
}

