// core/api/test/test.interface.ts

export interface TestAnswerOption {
  id: number;
  label: string | null;      // Answer.option
  selected?: boolean;        // marca de selección
  selected_is_correct?: boolean | null; // solo en review_last y si fue seleccionada
}

export type QuestionTypeKey = 'single' | 'multiple' | null;

export interface QuestionType {
  id: number | null;
  name: string | null;
  key: QuestionTypeKey;
}

export interface TestQuestion {
  question_id: number;
  order: number;
  prompt: string | null;
  type: QuestionType | null;
  // En modo normal: null. En review_last: true/false según regla de acierto total.
  is_correct_question: boolean | null;
  // Solo si test.score == true && test.incorrect == true; en otro caso null.
  correct_spot: number | null;
  spot: number | null;
  answers: TestAnswerOption[];
}

/** Contexto mínimo del index */
export interface TestIndexContext {
  test_view_id: number;
}

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface TestIndexResponse {
  ok: boolean;
  context: TestIndexContext;
  data: {
    questions: TestQuestion[];
  };
  pagination: Pagination;
}

/** Query para index */
export interface TestPageQuery {
  page?: number;
  per_page?: number;
  review_last?: boolean; // true para revisar último intento completado
}

/** --------- SHOW (meta para iniciar componente de test) --------- */

export interface UserState {
  is_saved: boolean;
  liked_chapter: boolean;
}

export interface TestShowData {
  course_title:  string | null;
  chapter_title: string;
  test: {
    id:              number;
    limited:         number;        // 0 = ilimitado
    questions_count: number;        // ya aplica split si corresponde
  };
  attempts: {
    can_retry:                boolean;
    in_progress_test_view_id: number | null;
    completed:                number; // cantidad de intentos completados
  };
  last_completed_test_view_id: number | null;
  can_view_last_answers: boolean;

  // Agregado: meta del último intento completado
  last_score:         number | null; // null si test.score == false o no existe intento
  last_completed_at:  string | null; // ISO o null

  user_state: UserState;
  likes_total: number;
}

export interface TestShowResponse {
  ok: boolean;
  data: TestShowData;
}
/** --------- AUTOSAVE --------- */

export interface AutosaveRequestDto {
  question_id: number;
  answer_ids: number[];        // reemplaza selección completa (single/multiple)
  mode?: 'replace';            // reservado para futuros modos
}

export interface AutosaveResponse {
  ok: boolean;
  message: string;
  data: {
    test_view_id: number;
    question_id: number;
    answer_ids: number[];
    autosaved_at: string;      // ISO
  };
  meta: {
    limited: number;
    attempts_used: number;
    attempts_left: number | null;
  };
}
