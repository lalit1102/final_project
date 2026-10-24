import { Document } from "mongoose";
import { PermissionCode } from "./permission.types";

export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
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
  permissions: PermissionCode[];
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