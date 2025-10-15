export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdDate: Date;
  updatedDate: Date;
  avatar?: string;
  department?: string;
  permissions: string[];
}

export enum UserRole {
  Admin = 'admin',
  Manager = 'manager',
  Staff = 'staff',
  Viewer = 'viewer'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}