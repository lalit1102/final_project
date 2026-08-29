export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
};

const requiredVariables = [
  ["MONGODB_URI", env.MONGODB_URI],
  ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
  ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
].filter(([, value]) => !value);

if (requiredVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${requiredVariables.map(([name]) => name).join(", ")}`);
}