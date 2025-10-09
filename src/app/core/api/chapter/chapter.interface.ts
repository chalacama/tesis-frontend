// core/api/chapter/chapter.interface.ts
export interface ChapterResponse {
    ok:      boolean;
    chapter: Chapter;
}

export interface Chapter {
    id:          number;
    title:       string;
    description: string;
    order:       number;
    module_id:   number;
    created_at:  string;
    updated_at:  string;
    deleted_at:  null;
}

export interface ChapterUpdateRequest {
  title: string;
  description: string | null;
}
export interface LearingContentResponse {
  ok:               boolean;
  chapter_id:       number;
  learning_content: LearningContent;
}

export interface LearningContent {
  id:                    number;
  url:                   string;
  type_content_id:       number;
  created_at:            string;
  updated_at:            string;
  type_learning_content: TypeLearningContent;
}

export interface TypeLearningContent {
  id:                   number;
  name:                 string;
  max_size_mb:          null;
  min_duration_seconds: null;
  max_duration_seconds: null;
  created_at:          string;
  updated_at:           string;
}
// core/api/chapter/chapter.interface.ts
export interface LearningContentUpdate {
  type_content_id: number;
  url: string | null;
  file: File | null;
  /* size: number | null;
  duration: number | null; */
}

export interface QuestionResponse {
  filters:   Filters;
  questions: Question[];
  meta:      Meta;
}

export interface Filters {
  q:                 string;
  type_questions_id: null;
  order_by:          string;
  order_dir:         string;
  per_page:          number;
  include_correct:   boolean;
}

export interface Meta {
  current_page: number;
  per_page:     number;
  total:        number;
  last_page:    number;
  has_more:     boolean;
}

export interface Question {
  id:                number;
  statement:         string;
  spot:              string;
  type_questions_id: number;
  chapter_id:        number;
  created_at:        string;
  updated_at:        string;
  deleted_at:        null;
  type_question:     TypeQuestion;
  answers:           Answer[];
}

export interface Answer {
  id:          number;
  option:      string;
  is_correct:  number;
  question_id: number;
}

export interface TypeQuestion {
  id:     number;
  nombre: string;
}
export type QuestionFilters = {
  q: string;
  type_questions_id: number | null;
  order_by: 'spot' | 'created_at' | 'id';
  order_dir: 'asc' | 'desc';
  per_page: number;
  include_correct: boolean;
  page?: number;
};

export interface QuestionUpdateRequest {
  questions: QuestionUpdateItem[];
}

export interface QuestionUpdateItem {
  id: number | null;
  statement: string;
  type_questions_id: number;
  spot?: number; // opcional: si lo envías, el backend lo usa; si no, usa el índice
  answers: AnswerUpdateItem[];
}

export interface AnswerUpdateItem {
  id: number | null;
  option: string;
  // el backend acepta 0/1/true/false; enviamos 0/1 desde el buildPayload
  is_correct: 0 | 1 | boolean;
  spot?: number; // solo si tu tabla answers tiene 'spot'
}

export interface QuestionUpdateResponse {
  message: string;
  questions: Question[]; // reutilizamos tu modelo de lectura
}



