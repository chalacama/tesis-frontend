// core/api/watching/comment.interface.ts

/** Respuesta de lista de comentarios raíz (index) */
export interface CommentResponse {
  data:  Datum[];
  links: Links;
  meta:  Meta;
  ok:    boolean;
  owner: OwnerSummary | null;

  /** Metadatos extra del index */
  total_comments?: number; // total del curso (raíz + todas las respuestas)
  total_roots?:    number; // solo comentarios raíz (opcional)
}

/** Respuesta de lista de respuestas (replies) */
export interface RepliesResponse {
  data:  Datum[];
  links: Links;
  meta:  Meta;
  ok:    boolean;

  parent_comment_id: number;     // id del comentario raíz solicitado
  depth?: "all" | number;        // el backend devuelve "all" cuando trae todo el hilo
}

/** Respuesta al crear un comentario (store) */
export interface SingleCommentResponse {
  data: Datum;
  ok: boolean;
  message?: string;
}

export interface OwnerSummary {
  id:       number;
  username: string;
  name:     string;
  lastname: string;
  avatar:   string | null;
}

/** Comentario o respuesta (DTO principal) */
export interface Datum {
  id:               number;
  parent_id:        number | null;
  text:             string;
  created_at:       string;

  likes:            number;
  liked_by_me:      boolean;
  liked_by_owner?:  boolean;

  /** Hijos directos (primer nivel) */
  replies_count:    number;

  /** Total real de respuestas en el subárbol (todos los niveles).
   *  Si no viene, usar replies_count como fallback. */
  all_replies_count?: number;

  /** Profundidad relativa respecto al root (en replies): 1=hijo, 2=nieto, ... */
  depth?: number;

  /** Usuario autor del comentario */
  user: User;

  /** Usuario al que se responde (padre inmediato), para pintar @username en UI */
  reply_to?: User | null;
}

export interface User {
  id:       number;
  username: string;
  name:     string;
  lastname: string;
  avatar:   string | null;
}

export interface Links {
  first: string;
  last:  string | null;
  prev:  string | null;
  next:  string | null;
}

export interface Meta {
  current_page:     number;
  current_page_url: string;
  from:             number | null;
  path:             string;
  per_page:         number;
  to:               number | null;

  // Si cambias a paginate() en backend, podrían venir:
  last_page?: number;
  total?:     number;
}

/** Params de paginación */
export type PaginationParams = {
  per_page?: number;
  page?: number;
};

/** Payload para crear comentario o respuesta */
export interface CreateCommentDto {
  texto: string;
  parent_id?: number; // si viene, se crea como respuesta a ese comentario
}
