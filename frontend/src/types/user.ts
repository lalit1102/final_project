import { UserRole } from "../constants/roles";

/**
 * User type — mirrors the backend profile response subset.
 * The backend's getProfile service returns: { id, name, email, role, avatar }
 * Frontend only uses these fields (never password, refreshToken, etc.)
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
}
