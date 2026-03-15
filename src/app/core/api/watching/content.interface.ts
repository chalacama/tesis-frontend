// content.interface.ts
export interface ContentResponse {
    ok:               boolean;
    user_state:       UserState;
    chapter:          Chapter;
    course:           Course;
    owner:            Owner;
    learning_content: LearningContent;
    learning_meta:    LearningMeta;
    last_view:        LastView;
    likes_total:      number;
}

export interface Chapter {
    id:          number;
    title:       string;
    description: string;
    order:       number;
    module_id:   number;
}

export interface Course {
    title: string;
    private: boolean;
}

export interface LastView {
    second_seen: number;
    updated_at:  string;
}

export interface LearningContent {
    id:                    number;
    name:                  string | null;
    url:                   string;
    size:               string | null; // <-- NUEVO
    duration_seconds:      number | null; // <-- NUEVO
    type_content_id:       number;
    format_id:             number;        // <-- NUEVO
    chapter_id:            number;
    created_at:            string;
    updated_at:            string;
    
    type_learning_content: TypeLearningContent;
    format?:                Format;       // <-- NUEVO (Relación cargada)
}
// <-- NUEVA INTERFAZ PARA LA RELACIÓN -->
export interface Format {
    id:   number;
    name: string;
}
export interface TypeLearningContent {
    id:   number;
    name: string;
}

export interface LearningMeta {
    type:   string;
    format: string;
    size_mb:            number | null; // <-- NUEVO
    duration_seconds:   number | null; // <-- NUEVO
    duration_formatted: string | null; // <-- NUEVO
}

export interface Owner {
    name:                string;
    lastname:            string;
    username:            string;
    is_owner:            boolean;
    profile_picture_url: string;
}

export interface UserState {
    is_saved:      boolean;
    
    liked_chapter: boolean;
    has_questions: boolean;
}

