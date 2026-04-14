// type.interface.ts
export interface LearningContentFormatResponse {
  id: number;
  name: string;
  max_size_bytes: number | null;
  min_duration_seconds: number | null;
  max_duration_seconds: number | null;
  enabled: number | boolean;
  type_learning_content_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TypeLearningContentResponse {
  id: number;
  name: string;
  enabled: number | boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  formats: LearningContentFormatResponse[];
}

export interface TypeQuestionResponse {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface TypeThumbnailResponse {
  id: number;
  name: string;
  max_size_bytes: number | null;
  width: number | null;
  height: number | null;
  aspect_ratio: string | null;
  enabled: number | boolean;
  created_at: string;
  updated_at: string;
}

