// notification.interface.ts

// notification.interface.ts

export type NotificationKey =
  | 'certificate.obtained'
  | 'course.updated'
  | 'course.new_content'
  | 'course.commented'
  | 'comment.replied'
  | string; // por si agregas más tipos luego

export interface NotificationData {
  key: NotificationKey;
  title: string;
  message: string;
  url?: string;

  // 🔹 NUEVO: para invitaciones de curso
  token?: string;
  invitation_id?: number;

  // Extras de curso, etc.
  course_id?: number;
  course_title?: string;
  chapter_id?: number;
  chapter_title?: string;
  certificate_code?: string;
  parent_comment_id?: number;
  reply_comment_id?: number;
  comment_snippet?: string;
  reply_snippet?: string;
  type_content?: string;

  [key: string]: unknown;
}


export interface ApiNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface NotificationIndexResponse {
  ok: boolean;
  data: ApiNotification[];
  meta: NotificationMeta;
}

export interface UnreadCountResponse {
  ok: boolean;
  count: number;
}

export interface ApiMessageResponse {
  ok: boolean;
  message: string;
}
