// core/api/watching/comment.interface.ts
export interface CommentResponse {
  data:  Datum[];
  links: Links;
  meta:  Meta;
  ok:    boolean;
}

export interface RepliesResponse extends CommentResponse {
  parent_comment_id: number; // viene en el endpoint de replies
}

export interface Datum {
  id:            number;
  text:          string;
  created_at:    string;
  likes:         number;
  liked_by_me:   boolean;
  replies_count: number;
  user:          User;
}

export interface User {
  id:       number;
  username: string;
  name:     string;
  lastname: string;
  avatar:   string | null;
}

export interface Links {
  first: string;
  last:  string | null;
  prev:  string | null;
  next:  string | null;
}

export interface Meta {
  current_page:     number;
  current_page_url: string;
  from:             number | null;
  path:             string;
  per_page:         number;
  to:               number | null;
}

export type PaginationParams = {
  per_page?: number;
  page?: number;
};
