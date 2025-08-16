
// export interface CourseDetailResponse {
//   message: string;
//   course:  CourseDetail;
// }

// export interface CourseDetail {
//   id:            number;
//   title:         string;
//   description:   string;
//   private:       boolean;
//   code:          null;
//   enabled:       boolean;
//   difficulty_id: number;
//   created_at:    Date;
//   updated_at:    Date;
//   deleted_at:    Date;
//   difficulty:    Difficulty;
// }
// export interface Difficulty {
//     id:   number;
//     name: string;
// }
export interface CourseDetailResponse {
    message: string;
    course:  CourseDetail;
}

export interface CourseDetail {
    id:            number;
    title:         string;
    description:   string;
    private:       boolean;
    code:          null;
    enabled:       boolean;
    difficulty_id: number;
    created_at:    Date;
    updated_at:    Date;
    deleted_at:    null;
    miniature:     Miniature;
    careers:       Career[];
    categories:    Category[];
    difficulty:    Difficulty;
}

export interface Career {
    id:    number;
    name:  string;
    pivot: CareerPivot;
}

export interface CareerPivot {
    course_id: number;
    career_id: number;
}

export interface Category {
    id:    number;
    name:  string;
    pivot: CategoryPivot;
}

export interface CategoryPivot {
    course_id:   number;
    category_id: number;
}

export interface Difficulty {
    id:   number;
    name: string;
}

export interface Miniature {
    id:        number;
    course_id: number;
    url:       string;
}

