import { userRepository } from "@/repositories/user.repository";
import { RegisterInput, LoginInput, ChangePasswordInput, ResetPasswordInput, UpdateProfileInput } from "@/validations/auth.validation";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { hashPassword, comparePassword } from "@/lib/password";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { JwtPayload } from "@/types/auth.types";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { AuthProvider, UserRole } from "@/types/user.types";
import { getRolePermissions } from "@/lib/permissions";
import { logger } from "@/utils/logger";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.USER_EXISTS, STATUS_CODES.CONFLICT);
    }

    const hashedPassword = await hashPassword(data.password);

    const rolePermissions = getRolePermissions(UserRole.STUDENT);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
      permissions: rolePermissions,
    });
    
    logger.info(`User registered successfully: ${user.email}`);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  }

  async login(data: LoginInput) {
    const user = await userRepository.findByEmail(data.email);

    if (!user || !user.password) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError(ERROR_MESSAGES.ACCOUNT_LOCKED, STATUS_CODES.FORBIDDEN);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      await userRepository.incrementLoginAttempts(user.email, MAX_LOGIN_ATTEMPTS, LOCK_TIME_MS);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    // Reset login attempts and set last login
    await userRepository.updateLastLogin(user._id.toString());

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });

    // Save refresh token in DB for rotation
    await userRepository.update(user._id.toString(), { refreshToken });
    
    logger.info(`User logged in successfully: ${user.email}`);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      
      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      // Check if refresh token matches the one in DB (Rotation)
      const userWithToken = await userRepository.findByEmail(user.email);
      if (userWithToken?.refreshToken !== token) {
        // Potential token reuse detected, revoke all tokens
        await userRepository.update(user._id.toString(), { refreshToken: null });
        logger.warn(`Refresh token reuse detected for user: ${user.email}`);
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
      }

      const newAccessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
      const newRefreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });
      
      await userRepository.update(user._id.toString(), { refreshToken: newRefreshToken });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, STATUS_CODES.UNAUTHORIZED);
    }
  }

  async logout(userId: string) {
    await userRepository.update(userId, { refreshToken: null });
    logger.info(`User logged out successfully: ${userId}`);
    return true;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
   
    const user = await userRepository.findById(userId);


    if (!user || !user.password) {
    
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }


    const isValid = await comparePassword(data.currentPassword, user.password);

    if (!isValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, STATUS_CODES.BAD_REQUEST);
    }

    const newHashedPassword = await hashPassword(data.newPassword);
    const updateResult = await userRepository.update(userId, {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
      refreshToken: null, // revoke tokens on password change
    });

    logger.info(`User changed password successfully: ${user.email}`);
    return true;
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silent return for security

    const resetToken = jwt.sign({ userId: user._id.toString(), type: 'reset' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    
    // In production, send via EmailService
    const { emailService } = await import('@/services/email.service');
    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(data: ResetPasswordInput) {
    try {
      const decoded = jwt.verify(data.token, env.JWT_ACCESS_SECRET) as JwtPayload;
      if (decoded.type !== 'reset') throw new Error();

      const user = await userRepository.findById(decoded.userId);
      if (!user) throw new Error();

      const newHashedPassword = await hashPassword(data.newPassword);
      await userRepository.update(user._id.toString(), {
        password: newHashedPassword,
        passwordChangedAt: new Date(),
        refreshToken: null,
      });
      
      logger.info(`User reset password successfully: ${user.email}`);
      return true;
    } catch (e) {
      throw new AppError(ERROR_MESSAGES.TOKEN_INVALID, STATUS_CODES.BAD_REQUEST);
    }
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND);

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      permissions: user.permissions,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await userRepository.update(userId, {
      ...(data.name && { name: data.name }),
      ...(data.avatar && { avatar: data.avatar })
    });
    
    if (!user) throw new AppError(ERROR_MESSAGES.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      permissions: user.permissions,
    };
  }

  async googleLogin(idToken: string) {
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }
    
    let user = await userRepository.findByEmail(payload.email);
    
    if (!user) {
      const rolePermissions = getRolePermissions(UserRole.STUDENT);
      user = await userRepository.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        provider: AuthProvider.GOOGLE,
        providerId: payload.sub,
        avatar: payload.picture,
        isVerified: payload.email_verified || false,
        permissions: rolePermissions,
      });
      logger.info(`New user registered via Google: ${user.email}`);
    } else {
      // Link account if it was local but now logging in with google, or just update providerId
      if (!user.providerId) {
        await userRepository.update(user._id.toString(), {
          providerId: payload.sub,
          provider: AuthProvider.GOOGLE, // Optionally keep LOCAL if you support multiple providers in an array, here we override or assume they login via Google now.
          isVerified: true
        });
      }
    }
    
    await userRepository.updateLastLogin(user._id.toString());
    
    const accessToken = generateAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), role: user.role });
    
    await userRepository.update(user._id.toString(), { refreshToken });
    
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        permissions: user.permissions,
      },
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
