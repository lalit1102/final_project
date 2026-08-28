import { IUser } from "@/types/user.types";

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  providerId?: string | null;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Strips sensitive fields (password, refreshToken, loginAttempts, etc.)
 * from a user object before sending it to the client.
 *
 * Fields excluded:
 *   - password       (bcrypt hash)
 *   - refreshToken   (JWT refresh token)
 *   - loginAttempts  (internal security counter)
 *   - lockUntil      (internal security field)
 *   - passwordChangedAt (internal field, not needed externally)
 *   - permissions    (unused field, excluded per audit)
 *
 * Fields projected to "id" instead of "_id" for cleaner API response.
 */
export function sanitizeUser(user: IUser | null): SanitizedUser | null {
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    provider: user.provider,
    providerId: user.providerId ?? null,
    avatar: user.avatar ?? null,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    lastLogin: user.lastLogin ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
