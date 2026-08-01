import User from "@/models/user.model";
import { IUser } from "@/types/user.types";
import { UpdateQuery } from "mongoose";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select("+password +refreshToken");
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).select("+password");
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ providerId: googleId });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async update(id: string, updateData: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
    });
  }

  async exists(email: string): Promise<boolean> {
    const user = await User.exists({ email });
    return !!user;
  }
  
  async incrementLoginAttempts(email: string, maxAttempts: number, lockTimeMs: number): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) return;
    
    // If account is already locked and time hasn't passed, don't increment
    if (user.lockUntil && user.lockUntil > new Date()) {
      return;
    }
    
    // Reset if it's past the lock time
    let attempts = user.loginAttempts;
    if (user.lockUntil && user.lockUntil <= new Date()) {
       attempts = 0;
    }

    const updates: UpdateQuery<IUser> = { 
      $inc: { loginAttempts: 1 } 
    };

    if (attempts + 1 >= maxAttempts) {
      updates.$set = {
        lockUntil: new Date(Date.now() + lockTimeMs)
      };
    } else {
       updates.$unset = { lockUntil: 1 };
    }

    await User.updateOne({ email }, updates);
  }
}

export const userRepository = new UserRepository();