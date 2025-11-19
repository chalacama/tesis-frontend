// certification.component.ts

import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IconComponent } from '../../../../shared/UI/components/button/icon/icon.component';
import { CertificateService } from '../../../../core/api/certificate/certificate.service';
import { CertificateView } from '../../../../core/api/certificate/certificate.interface';

@Component({
  selector: 'app-certification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './certification.component.html',
  styleUrls: ['./certification.component.css'],
})
export class CertificationComponent implements OnInit {

  // Carousel
  carouselImages: string[] = [
    // si tus imágenes están en Laravel `public/img/cover/*`
    // y el front vive en el mismo dominio, esto funciona tal cual.
    '/img/cover/portada-a-certificate.jpg',
    '/img/cover/portada-b-certificate.png',
    '/img/cover/portada-c-certificate.png',
  ];
  currentSlide = 0;

  // Lista de certificados
  certificates: CertificateView[] = [];

  // Paginación / scroll infinito
  page = 1;
  perPage = 5;
  hasMore = true;
  loading = false;
  initialLoading = true;

  // Filtros
  search = '';
  fromDate: string | null = null;   // YYYY-MM-DD
  toDate: string | null = null;     // YYYY-MM-DD

  // Skeleton
  skeletonItems = Array.from({ length: 3 });

  constructor(
    private certificateService: CertificateService,
  ) {}

  ngOnInit(): void {
    this.loadCertificates(true);
  }

  // ------------ CARGA DE CERTIFICADOS ------------

  private loadCertificates(reset = false): void {
    if (this.loading) return;
    if (!this.hasMore && !reset) return;

    if (reset) {
      this.page = 1;
      this.certificates = [];
      this.hasMore = true;
      this.initialLoading = true;
    }

    this.loading = true;

    this.certificateService.index({
      page: this.page,
      perPage: this.perPage,
      search: this.search || undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
    }).subscribe({
      next: (res) => {
        if (reset) {
          this.certificates = res.data;
        } else {
          this.certificates = [...this.certificates, ...res.data];
        }

        this.hasMore = !!res.meta.next_page;
        if (res.meta.next_page) {
          this.page = res.meta.next_page;
        }
      },
      error: () => {
        this.hasMore = false;
      },
      complete: () => {
        this.loading = false;
        this.initialLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadCertificates(true);
  }

  clearFilters(): void {
    this.search = '';
    this.fromDate = null;
    this.toDate = null;
    this.loadCertificates(true);
  }

  // ------------ SCROLL INFINITO (window) ------------

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.loading || !this.hasMore) return;

    const threshold = 300;
    const position = window.innerHeight + window.scrollY;
    const height = document.documentElement.scrollHeight;

    if (position > height - threshold) {
      this.loadCertificates(false);
    }
  }

  // ------------ ACCIONES ------------

  openCertificate(cert: CertificateView): void {
    this.certificateService.openPublicView(cert.certificate.code);
  }

  downloadCertificate(cert: CertificateView): void {
    if (!cert.can_download) return;
    this.certificateService.download(cert.certificate.code);
  }

  getStudentAvatar(cert: CertificateView): string | null {
    return this.certificateService.getStudentAvatar(cert);
  }

  getTutorAvatar(cert: CertificateView): string | null {
    return this.certificateService.getTutorAvatar(cert);
  }

  getCareerLogo(cert: CertificateView): string | null {
    return this.certificateService.getCareerLogo(cert);
  }

  // ------------ CAROUSEL ------------

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
  }

  prevSlide(): void {
    this.currentSlide =
      (this.currentSlide - 1 + this.carouselImages.length) %
      this.carouselImages.length;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}
