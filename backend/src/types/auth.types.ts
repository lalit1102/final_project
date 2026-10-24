export interface JwtPayload {
  userId: string;
  role: string;
  type?: "reset";
  iat?: number;
  exp?: number;
}
