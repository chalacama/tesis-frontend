export interface DifficultyResponse {
    success:      boolean;
    message:      string;
    data: Difficulty[];
}

export interface Difficulty {
    id:   number;
    name: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
