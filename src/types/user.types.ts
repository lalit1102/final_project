import { Document } from "mongoose";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

export enum AuthProvider {
  LOCAL = "LOCAL",
  GOOGLE = "GOOGLE",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string | null;
  provider: AuthProvider;
  providerId?: string | null;
  avatar?: string | null;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  isVerified: boolean;
  refreshToken?: string | null;
  lastLogin?: Date | null;
  loginAttempts: number;
  lockUntil?: Date | null;
  passwordChangedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}