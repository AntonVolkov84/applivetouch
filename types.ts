export type LoginFormData = {
  email: string;
  password: string;
};
export type UserAuthData = {
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  email: string;
  id: number;
  is_verified: Boolean;
  username: string;
  usersurname: string;
};
export type RegisterFormData = {
  username: string;
  usersurname: string;
  email: string;
  password: string;
};
export interface UserChat {
  id: number;
  username: string;
  usersurname: string;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
}

export interface Chat {
  chat_id: number;
  created_at: string;
  name?: string | null;
  type: "private" | "group";
  otherUser?: UserChat;
}
