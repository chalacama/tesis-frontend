// core/api/dashboard/panel.interfaces.ts

export type DashboardScope = 'admin' | 'tutor';

/**
 * Métrica: Tasa de finalización de contenidos
 */
export interface ContentCompletionMetric {
  total_views: number;
  completed: number;
  in_progress: number;
  completion_rate: number; // porcentaje 0–100
}

/**
 * Métrica: Rendimiento académico por evaluación
 */
export interface TestPerformanceMetric {
  label: string;      // título del capítulo
  avg_score: number;  // promedio de nota
  attempts: number;   // número de intentos
}

/**
 * Métrica: Popularidad de cursos (inscripciones por mes)
 */
export interface CoursePopularityMetric {
  month: string; // 'YYYY-MM'
  total: number;
}

/**
 * Distribución de estrellas
 */
export interface RatingDistributionItem {
  stars: number; // 1..5
  total: number;
}

/**
 * Métrica: Satisfacción (ratings)
 */
export interface CourseRatingsMetric {
  distribution: RatingDistributionItem[];
  average: number;       // promedio 1..5
  total_ratings: number; // total de calificaciones
}

/**
 * Métrica: Intereses por categoría (TOP N)
 */
export interface CategoryInterestMetric {
  category_id: number;
  name: string;
  total: number; // cuántos usuarios la tienen como interés
}

/**
 * Respuesta completa del endpoint /dashboard/index
 */
export interface DashboardPanelResponse {
  scope: DashboardScope;      // 'admin' | 'tutor'
  courses_count: number;
  metrics: {
    content_completion: ContentCompletionMetric;
    test_performance: TestPerformanceMetric[];
    course_popularity: CoursePopularityMetric[];
    course_ratings: CourseRatingsMetric;
    category_interests: CategoryInterestMetric[];
  };
}


