import User from "@/models/user.model";
import type { IUser } from "@/types/user.types";

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() }).lean().exec();
  }

  async findById(id: string) {
    return User.findById(id).lean().exec();
  }

  async create(data: Partial<IUser>) {
    return User.create(data);
  }

  async update(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, { new: true }).lean().exec();
  }

  async incrementLoginAttempts(email: string, maxAttempts: number, lockTimeMs: number) {
    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) return null;

    const nextAttempts = (user.loginAttempts ?? 0) + 1;
    const lockUntil = nextAttempts >= maxAttempts ? new Date(Date.now() + lockTimeMs) : null;

    return User.findByIdAndUpdate(
      user._id,
      { loginAttempts: nextAttempts, lockUntil },
      { new: true }
    ).lean().exec();
  }

  async updateLastLogin(id: string) {
    return User.findByIdAndUpdate(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
    }, { new: true }).lean().exec();
  }
}

export const userRepository = new UserRepository();
