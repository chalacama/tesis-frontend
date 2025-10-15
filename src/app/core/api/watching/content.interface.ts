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
}

export interface LastView {
    second_seen: number;
    updated_at:  string;
}

export interface LearningContent {
    id:                    number;
    url:                   string;
    type_content_id:       number;
    chapter_id:            number;
    created_at:            string;
    updated_at:            string;
    deleted_at:            null;
    type_learning_content: TypeLearningContent;
}

export interface TypeLearningContent {
    id:   number;
    name: string;
}

export interface LearningMeta {
    type:   string;
    format: string;
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
    is_registered: boolean;
    liked_chapter: boolean;
    has_questions: boolean;
}

