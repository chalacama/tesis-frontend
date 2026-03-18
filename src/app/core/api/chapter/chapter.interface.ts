// ── Chapter ─────────────────────────────────────────────────────────────────
export interface ChapterResponse {
  ok: boolean;
  chapter: Chapter;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  order: number;
  module_id: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterUpdateRequest {
  title: string;
  description: string | null;
}

// ── Tipos y formatos de contenido ────────────────────────────────────────────

/** Formato individual (pdf, mp4, mp3, docx, youtube…) */
export interface FormatItem {
  id: number;
  name: string;
  /** Bytes máximos permitidos; null = sin límite */
  max_size_bytes: number | null;
  /** Segundos mínimos para contenido media; null = sin límite */
  min_duration_seconds: number | null;
  /** Segundos máximos para contenido media; null = sin límite */
  max_duration_seconds: number | null;
}

/** Tipo de contenido con sus formatos activos (link, archive…) */
export interface TypeWithFormats {
  id: number;
  name: string;
  formats: FormatItem[];
}

// ── Learning Content ─────────────────────────────────────────────────────────

export interface LearningContent {
  id: number;
  /** Nombre original del archivo subido; null para links */
  name: string | null;
  url: string;
  /** Peso en bytes del archivo; null para links */
  size_bytes: number | null;
  /** Duración en segundos (video/audio); null para otros */
  duration_seconds: number | null;
  type_content_id: number;
  format_id: number | null;
  chapter_id?: number;
  created_at: string;
  updated_at: string;
  type_learning_content: { id: number; name: string } | null;
  format: FormatItem | null;
}

/**
 * Respuesta del endpoint show y update de learning-content.
 * Incluye los tipos+formatos activos para que el componente sea auto-suficiente.
 */
export interface LearingContentResponse {
  ok: boolean;
  chapter_id: number;
  learning_content: LearningContent | null;
  /** Todos los tipos activos con sus formatos activos */
  types: TypeWithFormats[];
}

export interface LearningContentUpdate {
  type_content_id: number;
  format_id: number;
  url?: string | null;
  file?: File | null;
  name?: string | null;
}

// ── Test + Questions ─────────────────────────────────────────────────────────

export interface TestConfig {
  id: number;
  chapter_id: number;
  random: boolean;
  incorrect: boolean;
  score: boolean;
  split: number;
  limited: number;
  questions_count: number;
  updated_at: string | null;
  created_at: string | null;
}

export interface QuestionResponse {
  filters: Filters;
  test: TestConfig | null;
  questions: Question[];
  meta: Meta;
}

export interface Filters {
  q: string;
  type_questions_id: number | null;
  order_by: 'order' | 'spot' | 'created_at' | 'id';
  order_dir: 'asc' | 'desc';
  per_page: number;
  include_correct: boolean;
}

export interface Meta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  has_more: boolean;
}

export interface Question {
  id: number;
  statement: string;
  spot: number;
  order: number;
  type_questions_id: number;
  test_id: number;
  created_at: string;
  updated_at: string;
  type_question: TypeQuestion;
  answers: Answer[];
}

export interface Answer {
  id: number;
  option: string;
  is_correct: number;
  order: number;
  question_id: number;
}

export interface TypeQuestion {
  id: number;
  nombre: string;
}

export type QuestionFilters = {
  q: string;
  type_questions_id: number | null;
  order_by: 'order' | 'spot' | 'created_at' | 'id';
  order_dir: 'asc' | 'desc';
  per_page: number;
  include_correct: boolean;
  page?: number;
};

export interface QuestionUpdateRequest {
  test?: QuestionUpdateTestPayload;
  questions: QuestionUpdateItem[];
}

export interface QuestionUpdateTestPayload {
  random?: boolean;
  incorrect?: boolean;
  score?: boolean;
  split?: number;
  limited?: number;
}

export interface QuestionUpdateItem {
  id: number | null;
  statement: string;
  type_questions_id: number;
  spot?: number;
  order?: number;
  answers: AnswerUpdateItem[];
}

export interface AnswerUpdateItem {
  id: number | null;
  option: string;
  is_correct: 0 | 1 | boolean;
  order?: number;
}

export interface QuestionUpdateResponse {
  message: string;
  test: TestConfig;
  questions: Question[];
}