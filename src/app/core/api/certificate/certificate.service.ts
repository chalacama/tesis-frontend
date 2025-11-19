// certificate.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CertificateShowResponse,
  CertificateIndexResponse,
  CertificateView,
} from './certificate.interface';
import { environment } from '../../environment/environment';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  // Ajusta esto si usas environment.apiUrl
 private readonly apiUrl = `${environment.apiUrl}/certificate`;

  constructor(private http: HttpClient , private router: Router) { }

  /**
   * Ver / validar un certificado público por código.
   * GET /api/certificate/show?code=XXXX
   */
  show(code: string): Observable<CertificateShowResponse> {
    const params = new HttpParams().set('code', code);

    return this.http.get<CertificateShowResponse>(`${this.apiUrl}/show`, { params });
  }

  /**
   * Listar certificados del usuario autenticado.
   * Soporta scroll infinito y filtros.
   *
   * GET /api/certificate/index?page=1&per_page=10&search=...&from_date=...&to_date=...
   */
  index(options: {
    page?: number;
    perPage?: number;
    search?: string;
    fromDate?: string; // 'YYYY-MM-DD'
    toDate?: string;   // 'YYYY-MM-DD'
  } = {}): Observable<CertificateIndexResponse> {

    let params = new HttpParams();

    if (options.page != null) {
      params = params.set('page', options.page.toString());
    }

    if (options.perPage != null) {
      params = params.set('per_page', options.perPage.toString());
    }

    if (options.search) {
      params = params.set('search', options.search);
    }

    if (options.fromDate) {
      params = params.set('from_date', options.fromDate);
    }

    if (options.toDate) {
      params = params.set('to_date', options.toDate);
    }

    return this.http.get<CertificateIndexResponse>(`${this.apiUrl}/index`, { params });
  }

  getProxiedImage(url?: string | null): string | null {
    if (!url) return null;
    return `${this.apiUrl}/image-proxy?url=${encodeURIComponent(url)}`;
    
  }


getStudentAvatar(cert: CertificateView | null): string | null {
  return cert?.certificate_owner?.profile_picture_url
    ? this.getProxiedImage(cert.certificate_owner.profile_picture_url)
    : null;
}

getTutorAvatar(cert: CertificateView | null): string | null {
  return cert?.course_owner?.profile_picture_url
    ? this.getProxiedImage(cert.course_owner.profile_picture_url)
    : null;
}

getCareerLogo(cert: CertificateView | null): string | null {
  return cert?.academic_information?.career?.url_logo
    ? this.getProxiedImage(cert.academic_information.career.url_logo)
    : null;
}

  /**
   * Abrir vista pública del certificado en una pestaña nueva.
   */
  openPublicView(code: string): void {
    const urlTree = this.router.createUrlTree(['/certificate', code]);
    const url = this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
  }

  /**
   * Descargar el certificado.
   * Reutiliza la misma vista con el queryParam ?print=1
   * (tu componente certificate.component ya sabe qué hacer con eso).
   */
  download(code: string): void {
    const urlTree = this.router.createUrlTree(['/certificate', code], {
      queryParams: { print: 1 }
    });
    const url = this.router.serializeUrl(urlTree);
    window.open(url, '_blank');
  }


  
}
