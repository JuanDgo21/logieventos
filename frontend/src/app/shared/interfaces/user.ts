export interface User {
  _id?: string;
  document: number;
  fullname: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'coordinador' | 'lider';
}
