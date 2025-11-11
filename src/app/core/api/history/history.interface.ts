// history.interface.ts
// history.interface.ts

export type HistoryType = 'historial' | 'guardados' | 'completados';

export interface OwnerInfo {
  id: number | null;
  name: string | null;
  lastname: string | null;
  username: string | null;
  profile_picture_url: string | null;
}

export interface CertificateInfo {
  id: number;
  code: string;
  created_at: string; // ISO
}

export interface LastChapterInfo {
  id: number | null;
  title: string | null;
}

/**
 * Item base devuelto por el backend para cualquier tipo
 */
export interface HistoryItemBase {
  id: number;                 // course id
  title: string;
  miniature_url: string | null;
  created_at: string;         // ISO
  owner: OwnerInfo;
  completion_percent: number; // 0..100
  certificate: CertificateInfo | null;
}

/**
 * Campos extras por tipo
 */
export interface HistoryItemHistorial extends HistoryItemBase {
  last_chapter?: LastChapterInfo;
  last_seen_at?: string | null; // ISO
}

export interface HistoryItemGuardados extends HistoryItemBase {
  saved_updated_at?: string | null; // ISO
}

export interface HistoryItemCompletados extends HistoryItemBase {
  // En completados viene certificado; lo mantenemos como no-null a nivel de uso.
  certificate: CertificateInfo;
}

/**
 * Unión “flexible”: puedes usar discriminación por response.type.
 * Si prefieres, crea tres respuestas separadas por tipo.
 */
export type HistoryItem =
  | HistoryItemHistorial
  | HistoryItemGuardados
  | HistoryItemCompletados;

export interface PaginatedResponse<T> {
  ok: boolean;
  type: HistoryType;
  per_page: number;
  current_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  total: number;
  data: T[];
}
