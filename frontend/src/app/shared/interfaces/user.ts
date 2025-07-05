export interface User {
  _id?: string;
  document: number;
  fullname: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'coordinador' | 'lider';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}