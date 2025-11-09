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
