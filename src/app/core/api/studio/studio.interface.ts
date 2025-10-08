export interface MiniatureResponse {
    course:    Course;
    miniature: Miniature | null;
}

export interface Course {
    id:            number;
    title:         string;
    description:   string;
    private:       boolean;
    code:          string;
    enabled:       boolean;
    difficulty_id: number;
    created_at:    Date;
    updated_at:    Date;
    deleted_at:    null;
}

export interface Miniature {
    id:         number;
    course_id:  number;
    url:        string;
    created_at: Date;
    updated_at: Date;
    deleted_at: null;
}
