export interface DecodedToken {
  id: string;
  username?: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UserData {
  _id: string;
  email: string;
  username?: string;
  fullname?: string;
  document?: number;
  roles: string[];
}