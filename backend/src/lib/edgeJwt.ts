import { jwtVerify } from "jose";
import { env } from "@/config/env";

export async function verifyEdgeAccessToken(token: string) {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET || "dev-access-secret");
  const { payload } = await jwtVerify(token, secret);

  return {
    userId: String(payload.userId ?? payload.sub ?? ""),
    role: String(payload.role ?? "STUDENT"),
  };
}
