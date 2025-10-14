export interface User {
  _id?: string;
  document: number;
  fullname: string;
  username: string;
  email: string;
  password?: string;
  role: 'admin' | 'coordinador' | 'lider';
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}