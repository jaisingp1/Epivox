export interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: "admin" | "creator";
  is_active: boolean;
  created_at: string;
}

export interface InvitationItem {
  id: number;
  email: string;
  token: string;
  role: "admin" | "creator";
  invited_by_user_id: number;
  invited_by_username?: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}
