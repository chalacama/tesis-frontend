// structure.interface.ts
export interface WatchingResponse {
    ok:     boolean;
    course: Course;
}

export interface Course {
    id:            number;
    title:         string;
    updated_at:    string;
    created_at:    string;
    is_registered: boolean;
    last_viewed_chapter: LastViewedChapter | null;
    modules:       Module[];
}
export interface LastViewedChapter {
    chapter_id: number;
    chapter_title:string;
    content_views: ContentView | null;
}
export interface ContentView {
    learning_content_id: number;
    seen_at: string;
    second_seen: number | string;
}
export interface Module {
    id:         number;
    name:       string;
    order:      number;
    updated_at: string;
    created_at: string;
    chapters:   Chapter[];
}

export interface Chapter {
    id:                number;
    title:             string;
    description:       string;
    order:             number;
    updated_at:        string;
    created_at:        string;
    questions_count:   number;
    learning:          Learning | null;
    completed_chapter: CompletedChapter | null;
}
export interface Learning {
    type: string | null;
    format: string | null;
}
export interface CompletedChapter {
    is_completed: boolean;
    content_at:   null | string;
    test_at:      null | string;
    completed_at: null | string;
}
