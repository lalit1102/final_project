import { jwtVerify, type JWTPayload } from "jose";
import { env } from "@/config/env";

export interface EdgeJwtPayload extends JWTPayload {
  userId: string;
  role: string;
  type?: string;
}

export async function verifyEdgeAccessToken(token: string): Promise<EdgeJwtPayload> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jwtVerify(token, secret);

  if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid access token payload");
  }

  return payload as EdgeJwtPayload;
}
