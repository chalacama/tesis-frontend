import { Role, User } from "./user";

export interface AuthResponse {
  message: string;
  access_token: string;
  token_type: string;
  user: User;
  role: Role;
}
