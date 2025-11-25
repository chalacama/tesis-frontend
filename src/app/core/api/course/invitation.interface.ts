// core/api/invitation/invitation.interface.ts

export interface InvitationUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  profile_picture_url: string | null;
}

export interface InvitationValidateResponse {
  results: InvitationUser[];
}

export type InvitationType = 'collaborator' | 'owner' | string;
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | string;

export interface CourseInvitation {
  id: number;
  course_id: number;
  inviter_id: number;
  email: string;
  token: string;
  type: InvitationType;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
}

export interface InvitationCreateResponse {
  message: string;
  invitation: CourseInvitation;
}

export interface AcceptInvitationResponse {
  // cuando todo va bien
  message?: string;

  // cuando el backend responde flujos especiales
  status?: 'user_not_found' | 'authentication_required' | string;
  email?: string;
}

export interface ApiMessageResponse {
  message: string;
}
