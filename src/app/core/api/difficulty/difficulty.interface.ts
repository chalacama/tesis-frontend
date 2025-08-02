export interface DifficultyResponse {
    message:      string;
    difficulties: Difficulty[];
}

export interface Difficulty {
    id:   number;
    name: string;
}
