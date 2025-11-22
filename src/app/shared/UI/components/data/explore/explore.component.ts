import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { IconComponent } from '../../button/icon/icon.component';
import { DialogComponent } from '../../overlay/dialog/dialog.component';

import { FeedbackService } from '../../../../../core/api/feedback/feedback.service';
import { CertificateService } from '../../../../../core/api/certificate/certificate.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DialogComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css'
})
export class ExploreComponent {
  dialogShow = false;

  selectedOption: 'course' | 'certificate' = 'course';

  courseCode = '';
  certificateCode = '';

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private feedbackService: FeedbackService,
    private certificateService: CertificateService,
    private router: Router
  ) {}

  openDialog(option: 'course' | 'certificate' = 'course') {
    this.selectedOption = option;
    this.dialogShow = true;
    this.resetState();
  }

  closeDialog() {
    this.dialogShow = false;
    this.loading = false;
    this.errorMessage = null;
  }

  changeOption(option: 'course' | 'certificate') {
    if (this.loading) return;
    this.selectedOption = option;
    this.errorMessage = null;
  }

  private resetState() {
    this.loading = false;
    this.errorMessage = null;
    // Si quieres limpiar códigos al abrir:
    // this.courseCode = '';
    // this.certificateCode = '';
  }

  private slugify(title: string): string {
    if (!title) return 'curso';
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  joinCourse() {
    const code = this.courseCode.trim();
    if (!code || this.loading) return;

    this.loading = true;
    this.errorMessage = null;

    this.feedbackService.enrollPrivate(code).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.ok && res.data) {
          const id = res.data.course_id;
          const titleSlug = this.slugify(res.data.course_title);

          this.closeDialog();
          // /learning/course/:title/:id
          this.router.navigate(['/learning', 'course', titleSlug, id]);
        } else {
          this.errorMessage =
            res?.message || 'No se pudo completar la inscripción al curso.';
        }
      },
      error: (err) => {
        this.loading = false;

        if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage =
            'Ocurrió un error al intentar inscribirte al curso.';
        }
      }
    });
  }

  searchCertificate() {
    const code = this.certificateCode.trim();
    if (!code || this.loading) return;

    this.loading = true;
    this.errorMessage = null;

    this.certificateService.show(code).subscribe({
      next: (res) => {
        this.loading = false;

        if (res?.success) {
          this.closeDialog();
          // Abre /certificate/:code en nueva pestaña
          this.certificateService.openPublicView(code);
        } else {
          this.errorMessage =
            'No se encontró ningún certificado con ese código.';
        }
      },
      error: (err) => {
        this.loading = false;

        if (err?.status === 404) {
          this.errorMessage =
            'No se encontró ningún certificado con ese código.';
        } else if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage =
            'Ocurrió un error al buscar el certificado.';
        }
      }
    });
  }
}
