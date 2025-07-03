export interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UserData {
  email: string;
  username?: string;
  roles: string[];
}