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