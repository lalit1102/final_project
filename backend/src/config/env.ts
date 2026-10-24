const getEnv = (key: string, fallback = "") => process.env[key] ?? fallback;

export const env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),
  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID", ""),
  REDIS_URL: getEnv("REDIS_URL", "redis://localhost:6379"),
  MONGODB_URI: getEnv("MONGODB_URI", "mongodb://localhost:27017/final-project"),
  ACCESS_TOKEN_EXPIRES_IN: getEnv("ACCESS_TOKEN_EXPIRES_IN", "15m"),
  REFRESH_TOKEN_EXPIRES_IN: getEnv("REFRESH_TOKEN_EXPIRES_IN", "7d"),
} as const;
