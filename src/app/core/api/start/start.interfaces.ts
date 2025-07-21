export interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
  is_certified: boolean;
  thumbnail_url: string | null;
  tutor: { name: string };
  category: { id: number; name: string } | null;
  careers: { id: number; logo_url: string }[];
  difficulty: { id: number; name: string };
  registrations_count: number;
  saved_courses_count: number;
  average_rating: number;
  is_saved: boolean;
  is_registered: boolean;
  first_learning_content_url: string | null;
}
