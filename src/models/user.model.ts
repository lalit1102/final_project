import { Schema, model, models } from "mongoose";
import { IUser, AuthProvider, UserRole } from "@/types/user.types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      select: false,
      default: null,
    },

    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },

    providerId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    
    permissions: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
    
    loginAttempts: {
      type: Number,
      default: 0,
    },
    
    lockUntil: {
      type: Date,
      default: null,
    },
    
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ providerId: 1 });
userSchema.index({ refreshToken: 1 });

const User = models.User || model<IUser>("User", userSchema);

export default User;