import { Document, Types } from "mongoose";

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
  permissions: string[];
  isActive: boolean;
  isVerified: boolean;
  refreshToken?: string | null;
  lastLogin?: Date | null;
  loginAttempts: number;
  lockUntil?: Date | null;
  passwordChangedAt?: Date | null;
  studentId?: string | null;
  parentIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}