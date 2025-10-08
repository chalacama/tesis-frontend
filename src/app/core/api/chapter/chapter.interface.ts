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

