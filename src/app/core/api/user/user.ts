export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  google_id?: string;
  registration_method?: string;
  profile_picture_url?: string;
  email_verified_at?: string;
}
