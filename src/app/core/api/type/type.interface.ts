// type.interface.ts
export interface TypeLarningContentResponse {
    id:                   number;
    name:                 string;
    max_size_mb:          null | string;
    min_duration_seconds: number | null;
    max_duration_seconds: number | null;
    created_at:           Date;
    updated_at:           Date;
    deleted_at:           null;
}
export interface TypeQuestionResponse {
    id:         number;
    nombre:     string;
    created_at: Date;
    updated_at: Date;
    deleted_at: null;
}

