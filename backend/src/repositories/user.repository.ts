import User from "@/models/user.model";
import { IUser, UserRole } from "@/types/user.types";
import { UpdateQuery } from "mongoose";

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select("+password +refreshToken");
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).select("+password");
  }

  async findByIdSafe(id: string): Promise<IUser | null> {
    return User.findById(id).select("-password -refreshToken");
  }

  async findByIds(ids: string[]): Promise<IUser[]> {
    return User.find({ _id: { $in: ids } }).select("-password -refreshToken");
  }

  async findStudentsByParentId(parentId: string): Promise<IUser[]> {
    return User.find({
      role: UserRole.STUDENT,
      isActive: true,
      parentIds: parentId,
    }).select("-password -refreshToken");
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ providerId: googleId });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async update(id: string, updateData: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true }).select("-password -refreshToken");
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null,
    });
  }

  async softDelete(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select("-password -refreshToken");
  }

  async exists(email: string): Promise<boolean> {
    const user = await User.exists({ email });
    return !!user;
  }

  async findAllPaginated(
    filter: Record<string, unknown>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 1 | -1,
  ): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { users: users as IUser[], total };
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