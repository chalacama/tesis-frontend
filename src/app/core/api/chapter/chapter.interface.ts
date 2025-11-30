// --- Chapter (sin cambios relevantes) ---
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

// --- Learning content (igual) ---
export interface LearingContentResponse {
  ok: boolean;
  chapter_id: number;
  learning_content: LearningContent;
}

export interface LearningContent {
  id: number;
  url: string;
  type_content_id: number;
  created_at: string;
  updated_at: string;
  type_learning_content: TypeLearningContent;
}

export interface TypeLearningContent {
  id: number;
  name: string;
  max_size_mb: null;
  min_duration_seconds: null;
  max_duration_seconds: null;
  created_at: string;
  updated_at: string;
}

export interface LearningContentUpdate {
  type_content_id: number;
  url: string | null;
  file: File | null;
}

// =======================
//   TEST + QUESTIONS
// =======================

// Nueva: config del test que devuelve el backend en index/update
export interface TestConfig {
  id: number;
  chapter_id: number;
  random: boolean;
  incorrect: boolean;
  score: boolean;
  split: number;
  limited: number; // 0..2
  questions_count: number;
  updated_at: string | null;
  created_at: string | null;
}

// Respuesta del index (agrega test)
export interface QuestionResponse {
  filters: Filters;
  test: TestConfig | null;         // <--- NUEVO
  questions: Question[];
  meta: Meta;
}

export interface Filters {
  q: string;
  type_questions_id: number | null;
  order_by: 'order' | 'spot' | 'created_at' | 'id'; // <--- agrega 'order'
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

// Lectura de pregunta ahora está ligada a TEST y usa order
export interface Question {
  id: number;
  statement: string;
  spot: number;                 // sigue existiendo si lo usas
  order: number;                // <--- NUEVO (orden dentro del test)
  type_questions_id: number;
  test_id: number;              // <--- ANTES era chapter_id
  created_at: string;
  updated_at: string;
  
  type_question: TypeQuestion;
  answers: Answer[];
}

export interface Answer {
  id: number;
  option: string;
  is_correct: number; // 0 | 1
  order: number;      // <--- NUEVO (orden de la respuesta)
  question_id: number;
}

export interface TypeQuestion {
  id: number;
  nombre: string;
}

// Filtros que envías al index
export type QuestionFilters = {
  q: string;
  type_questions_id: number | null;
  order_by: 'order' | 'spot' | 'created_at' | 'id'; // <--- default será 'order'
  order_dir: 'asc' | 'desc';
  per_page: number;
  include_correct: boolean;
  page?: number;
};

// Payload para actualizar test + preguntas
export interface QuestionUpdateRequest {
  test?: QuestionUpdateTestPayload;       // <--- NUEVO (config del test)
  questions: QuestionUpdateItem[];
}

export interface QuestionUpdateTestPayload {
  random?: boolean;
  incorrect?: boolean;
  score?: boolean;
  split?: number;      // >= 1
  limited?: number;    // 0..2
}

export interface QuestionUpdateItem {
  id: number | null;
  statement: string;
  type_questions_id: number;
  spot?: number;       // opcional
  order?: number;      // <--- NUEVO (orden dentro del test)
  answers: AnswerUpdateItem[];
}

export interface AnswerUpdateItem {
  id: number | null;
  option: string;
  is_correct: 0 | 1 | boolean;
  order?: number;      // <--- NUEVO (orden de la respuesta)
}

// Respuesta del update ahora incluye test
export interface QuestionUpdateResponse {
  message: string;
  test: TestConfig;        // <--- NUEVO
  questions: Question[];
}
