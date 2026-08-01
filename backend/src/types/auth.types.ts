export interface JwtPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh' | 'reset';
}