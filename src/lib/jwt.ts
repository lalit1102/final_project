import jwt, { JwtPayload as JsonwebtokenPayload, SignOptions } from "jsonwebtoken";
import { env } from "@/config/env";
import { JwtPayload } from "@/types/auth.types";

function buildToken(payload: Omit<JwtPayload, "type">, secret: string, expiresIn: string, type: JwtPayload["type"]): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign({ ...payload, type }, secret, options);
}

function normalizePayload(tokenPayload: JsonwebtokenPayload, expectedType: JwtPayload["type"]): JwtPayload {
  const userId = tokenPayload.userId ?? tokenPayload.sub;
  const role = tokenPayload.role;
  const tokenType = tokenPayload.type;

  if (typeof userId !== "string" || typeof role !== "string" || typeof tokenType !== "string") {
    throw new Error("Invalid token payload");
  }

  if (tokenType !== expectedType) {
    throw new Error("Unexpected token type");
  }

  return {
    userId,
    role,
    type: tokenType as JwtPayload["type"],
  };
}

export function generateAccessToken(payload: Omit<JwtPayload, "type">): string {
  return buildToken(payload, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_EXPIRES_IN, "access");
}

export function generateRefreshToken(payload: Omit<JwtPayload, "type">): string {
  return buildToken(payload, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_EXPIRES_IN, "refresh");
}

export function verifyAccessToken(token: string): JwtPayload {
  const verifiedToken = jwt.verify(token, env.JWT_ACCESS_SECRET) as JsonwebtokenPayload | string;

  if (typeof verifiedToken === "string") {
    throw new Error("Invalid access token");
  }

  return normalizePayload(verifiedToken, "access");
}

export function verifyRefreshToken(token: string): JwtPayload {
  const verifiedToken = jwt.verify(token, env.JWT_REFRESH_SECRET) as JsonwebtokenPayload | string;

  if (typeof verifiedToken === "string") {
    throw new Error("Invalid refresh token");
  }

  return normalizePayload(verifiedToken, "refresh");
}