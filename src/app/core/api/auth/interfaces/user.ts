export interface Role {
  id: number;
  name: string;
}
export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  profile_picture_url: string;
  roles: Role[];
}
