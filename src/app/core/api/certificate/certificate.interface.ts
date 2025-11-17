// certificate.interface.ts

export interface Category {
  id: number;
  name: string;
}

export interface CertificateCourse {
  id: number;
  title: string;
  miniature_url: string | null;
  difficulty: string | null;
  categories: Category[];
  created_at: string | null; // ISO string
}

export interface CertificateInfo {
  id: number;
  code: string;
  date: string | null;       // ISO string
  total_score: number;
}

export interface CertificateUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  profile_picture_url: string | null;
}

export interface SedeInfo {
  id: number;
  province: string;
  canton: string;
}

export interface EducationalUnitInfo {
  id: number;
  name: string;
  url_logo: string | null;
  organization_domain: string | null;
}

export interface CareerInfo {
  id: number;
  name: string;
  url_logo: string | null;
}

export interface AcademicInformation {
  sede: SedeInfo | null;
  educational_unit: EducationalUnitInfo | null;
  career: CareerInfo | null;
}

export interface CertificateView {
  course: CertificateCourse;
  certificate: CertificateInfo;
  course_owner: CertificateUser | null;
  certificate_owner: CertificateUser | null;
  academic_information: AcademicInformation;
  can_download: boolean;

}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  next_page: number | null;
  next_page_url: string | null;
}

export interface CertificateShowResponse {
  success: boolean;
  data: CertificateView;
}

export interface CertificateIndexResponse {
  success: boolean;
  data: CertificateView[];
  meta: PaginationMeta;
}
