// feedback.interface.ts
export interface LikedRequest {
    liked: boolean;
}
export interface SavedRequest {
    saved: boolean;
}
export interface LikeResponse {
    ok: boolean;
    liked: boolean;

}
export interface SavedResponse {
    ok: boolean;
    saved: boolean;
    
}
export interface ContendRequest {
    second_seen : number
}
export interface ContendResponse {
    ok: boolean;
    second_seen: number
    updated_at: string;
}

export interface LikedCommentRequest {
    liked: boolean;
}
export interface LikedCommentResponse {
    ok: boolean;
    liked: boolean;
}
// --- COMPLETED CHAPTER: contenido (progreso %) ---
export interface CompletedContentRequest {
  /** Incremento de progreso en % (0..100) relativo, no absoluto */
  delta: number;
}

export interface CompletedContentResponse {
  ok: boolean;
  message: string;
  data: {
    chapter_id: number;
    before: number;   // % antes de sumar delta
    after: number;    // % después de sumar delta (clamp 0..100)
    content_at: string | null;  // ISO string cuando cruza >=70% por primera vez
    test_at: string | null;     // ISO string si no hay test y se auto-completa al cruzar 70%
    crossed70: boolean;
    autoCompletedTest: boolean;
  };
}

// --- (Opcional, futuro) COMPLETED TEST ---
export interface CompletedTestRequest {
  /** Marca explícita de finalización del test; agrega otros campos (score, total, etc.) cuando lo implementes */
  completed: boolean;
  score?: number;
}

export interface CompletedTestResponse {
  ok: boolean;
  message: string;
  data?: {
    chapter_id: number;
    test_at: string | null;
  };
}

// ====== REGISTRATION (inscripción a cursos) ======

// Útil para tipar un body vacío {} de forma segura
export type EmptyBody = Record<string, never>;

/** Inscripción SIN código (cursos públicos y activos) */
export type RegisterCourseRequest = EmptyBody;

/** Inscripción CON código (cursos privados y activos) */
export interface RegisterCourseByCodeRequest {
  code: string;
}

/** Respuesta común de inscripción */
export interface RegisterCourseResponse {
  ok: boolean;
  message: string;
  data: {
    registration_id: number;
    course_id: number;
    user_id: number;
  };
}




