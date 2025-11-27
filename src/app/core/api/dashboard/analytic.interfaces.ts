// core/api/dashboard/analytic.interfaces.ts

/**
 * Info básica del curso
 */
export interface AnalyticsCourseInfo {
  id: number;
  title: string;
}

/**
 * Filtros de fecha que devuelve el backend
 */
export interface AnalyticsFilters {
  date_from: string | null; // 'YYYY-MM-DD' o null
  date_to: string | null;
}

/**
 * A) Embudo de retención por módulo
 */
export interface RetentionFunnelItem {
  module_id: number;
  name: string;
  students_completed: number; // alumnos que completaron al menos un contenido de ese módulo
}

/**
 * B) Tasa de certificación
 */
export interface CertificationMetric {
  registrations: number;
  certificates: number;
  rate: number; // porcentaje 0–100
}

/**
 * C) Distribución de progreso
 */
export interface ProgressBucket {
  label: string;      // texto: 0%, 1-50%, etc.
  count: number;      // número de alumnos en ese bucket
  percentage: number; // porcentaje respecto al total de alumnos
}

export interface ProgressDistributionMetric {
  total_students: number;
  total_contents: number;
  buckets: ProgressBucket[];
}

/**
 * D) Top 5 preguntas difíciles
 */
export interface DifficultQuestionMetric {
  question_id: number;
  statement: string;
  wrong_attempts: number;
}

/**
 * E) Feedback reciente
 */
export interface RecentFeedbackItem {
  user_name: string;
  text: string;
  stars: number | null;   // puede venir null si ese usuario no calificó el curso
  created_at: string;     // ISO string (fecha y hora)
}

/**
 * Respuesta completa del endpoint /dashboard/{course}/show
 */
export interface DashboardAnalyticsResponse {
  course: AnalyticsCourseInfo;
  filters: AnalyticsFilters;
  metrics: {
    retention_funnel: RetentionFunnelItem[];
    certification: CertificationMetric;
    progress_distribution: ProgressDistributionMetric;
    top_difficult_questions: DifficultQuestionMetric[];
    recent_feedback: RecentFeedbackItem[];
  };
}

