// start-portfolio.interface.ts

import { Course } from './start.interfaces';

/**
 * Request para el endpoint:
 * GET /start/portfolio-by-filter
 */
export interface PortfolioRequest {
  /** Username del propietario del portafolio */
  username: string;

  /** Tipo de cursos a listar */
  type: 'courses' | 'collaborations';

  /** Orden:
   *  - 'created'    => más recientes
   *  - 'popular'    => más inscritos + guardados
   *  - 'best_rated' => mejor puntuados
   */
  filter: 'created' | 'popular' | 'best_rated';

  page: number;
  per_page: number;

  /** Búsqueda por nombre de curso (opcional) */
  q?: string;
}

/**
 * Respuesta del portafolio (mismo shape que CourseResponse)
 */
export interface PortfolioCourseResponse {
  courses: Course[];
  has_more: boolean;
  current_page: number;
}
