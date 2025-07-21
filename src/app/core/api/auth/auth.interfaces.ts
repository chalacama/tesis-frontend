
export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  profile_picture_url: string;
  roles: Role[];
}
export interface Role {
  id: number;
  name: string;
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
  message: string;
  access_token: string;
  token_type: string;
  user: User;
  role: Role;
}



