export interface CourseResponse {
  courses: Course[];
  has_more: boolean;
  current_page: number;
}
export interface CourseRequest {
  filter : string;
  page: number;
  per_page: number;
}
export interface Course {
  id:                         number;
  title:                      string;
  description:                string;
  created_at:                 string;
  // is_certified:               boolean | number;
  thumbnail_url:              null | string;
  tutor:                      Tutor;
  category:                   Category;
  careers:                    Career[];
  difficulty:                 Category;
  registrations_count:        number;
  saved_courses_count:        number;
  average_rating:             number;
  is_saved:                   boolean;
  is_registered:              boolean;
  first_learning_content_url: null | string;
}

export interface Career {
  id:       number;
  logo_url: string;
}

export interface Category {
  id:   number;
  name: string;
}

export interface Tutor {
  id:                  number;
  name:                string;
  username:            string;
  profile_picture_url: null;
  
}



