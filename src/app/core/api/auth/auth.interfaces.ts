// core/api/auth/auth.interfaces.ts

export interface Role {
  id?: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  profile_picture_url: string;
  roles: Role[];

  // Flags que vienen tanto dentro de user (si los tienes como accessors)
  // como en la raíz de la respuesta de Laravel
  can_update_username: boolean;
  has_user_information: boolean;
  has_educational_user: boolean;
  has_user_category_interest: boolean;

  registration_method?: string; // 'email' | 'google' | ...
  google_id?: string | null;
}

export interface RegisterRequest {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  access_token: string;
  token_type: string;
  user: User;
  // En tu backend devuelves solo el nombre del rol: 'student', 'admin', etc.
  role: string;

  // Flags también a nivel raíz (los marcaste como NUEVOS CAMPOS / FLAGS en Laravel)
  can_update_username: boolean;
  has_user_information?: boolean;
  has_educational_user?: boolean;
  has_user_category_interest?: boolean;
  expires_at?: string;
}

export interface GoogleLoginRequest {
  token: string;
}
