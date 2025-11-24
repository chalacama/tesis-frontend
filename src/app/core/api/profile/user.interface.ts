// core/api/user/user.interfaces.ts

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdateUsernameResponse {
  message: string;
  username: string;
  username_at?: string; // por si lo usas luego en el perfil
}


export interface ValidateUsernameRequest {
  username: string;
}
export interface ValidateUsernameResponse {
  message: string;
  is_available: boolean;
}


