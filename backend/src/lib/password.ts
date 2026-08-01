import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[comparePassword] plain password:", password);
  }

  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (process.env.NODE_ENV !== "production") {
    console.log("[comparePassword] comparison result:", isMatch);
  }

  return isMatch;
}