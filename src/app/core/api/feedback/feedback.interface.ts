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
    // delta: number;
    second_seen : number
}
export interface ContendResponse {
    ok: boolean;
    second_seen: number;
    updated_at: string;
}

export interface LikedCommentRequest {
    liked: boolean;
}
export interface LikedCommentResponse {
    ok: boolean;
    liked: boolean;
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
    course_title: string;
    user_id: number;
  };
}

export interface ProgressRequest {
    progress: number;
}

export interface ProgressResponse {
    ok:      boolean;
    message: string;
    data:    ProgressData;
}

export interface ProgressData {
    chapter_id:         number;
    before:             number;
    after:              number;
    content_at:         null;
    test_at:            null;
    crossed70:          boolean;
    autoCompletedTest:  boolean;
    chapter_completed:  boolean;
    certificate_issued: boolean;
}








