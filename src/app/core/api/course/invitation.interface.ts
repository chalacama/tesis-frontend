// core/api/invitation/invitation.interface.ts

export interface BasicUser {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email?: string;
  profile_picture_url: string | null;
}

export interface CollaboratorInvitation {
  id: number;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  user: BasicUser | null;
}

export interface CollaboratorUserSlot {
  is_invitation: false;
  user: BasicUser;
}

export interface CollaboratorInvitationSlot {
  is_invitation: true;
  invitation: CollaboratorInvitation;
}

export type CollaboratorSlot =
  | CollaboratorUserSlot
  | CollaboratorInvitationSlot
  | null;

export interface CollaboratorShowResponse {
  course_id: number;
  owner: BasicUser | null;
  collaborator_slot: CollaboratorSlot;
  can_invite_collaborator: boolean;
  can_edit: boolean;
}

// Resultado del /collaborator/validate
export interface InvitationSearchUser extends BasicUser {
  email: string;
}

export interface ValidateInvitationResponse {
  results: InvitationSearchUser[];
}

// Invitación en BD
export interface CourseInvitation {
  id: number;
  course_id: number;
  user_id: number;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  updated_at: string;
}

// Respuestas genéricas
export interface ApiMessageResponse {
  message: string;
}

// POST /collaborator/{course}/store
export interface InviteCollaboratorResponse extends ApiMessageResponse {
  invitation: CourseInvitation;
}

// DELETE /collaborator/{course}/delete-owner/{user}
export interface DeleteOwnerResponse extends ApiMessageResponse {
  new_owner: BasicUser;
}

// DELETE /collaborator/{course}/leave
export interface LeaveCourseResponse extends ApiMessageResponse {
  new_owner?: BasicUser;
}

// PUT /collaborator/{course}/change
export interface ChangeRolesResponse extends ApiMessageResponse {
  owner: BasicUser | null;
  collaborator: BasicUser | null;
}

// POST /invitation/accept (pública)
export interface AcceptInvitationUserNotFoundResponse {
  status: 'user_not_found';
  message: string;
  email: string;
}

export interface AcceptInvitationSuccessResponse {
  message: string;
}

export type AcceptInvitationResponse =
  | AcceptInvitationUserNotFoundResponse
  | AcceptInvitationSuccessResponse;



