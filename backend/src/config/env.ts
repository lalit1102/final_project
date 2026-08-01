export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
};

const missingVariables = [
  ["MONGODB_URI", env.MONGODB_URI],
  ["JWT_ACCESS_SECRET", env.JWT_ACCESS_SECRET],
  ["JWT_REFRESH_SECRET", env.JWT_REFRESH_SECRET],
].filter(([, value]) => !value);

if (missingVariables.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVariables.map(([name]) => name).join(", ")}`);
}