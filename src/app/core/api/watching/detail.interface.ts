// detail.interface.ts
export interface DetailResponse {
    ok:     boolean;
    course: Course;
}

export interface Course {
    id:            number;
    description:   string;
    difficulty:    Difficulty;
    careers:       Career[] | null;
    categories:    Difficulty[] | null;
    ratings:       Ratings;
    collaborators: Collaborator[] | null;
}

export interface Career {
    id:       number;
    name:     string;
    url_logo: string | null;
}

export interface Difficulty {
    id:   number;
    name: string;
}

export interface Collaborator {
    name:                string;
    lastname:            string;
    username:            string;
    profile_picture_url: null | string;
}

export interface Ratings {
    count:       number;
    total_stars: number;
    avg_stars:   number;
    user_stars:  number;
}
