import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.service";
import { registerSchema, loginSchema } from "@/validations/auth.validation";
import { sendResponse } from "@/utils/apiResponse";
import { AppError } from "@/utils/AppError";
import { STATUS_CODES } from "@/constants/statusCodes";
import { ERROR_MESSAGES } from "@/constants/errorMessages";
import { logger } from "@/utils/logger";
import { z } from "zod";

export class AuthController {
  
  private setCookies(res: NextResponse, accessToken: string, refreshToken: string) {
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 mins
      path: "/",
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  }

  private clearCookies(res: NextResponse) {
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
  }

  async register(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = registerSchema.parse(body);
      
      const data = await authService.register(validatedData);
      
      return NextResponse.json(
        sendResponse(data, "Registration successful"),
        { status: STATUS_CODES.CREATED }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = loginSchema.parse(body);
      
      const { user, accessToken, refreshToken } = await authService.login(validatedData);
      
      const response = NextResponse.json(
        sendResponse({ user }, "Login successful"),
        { status: STATUS_CODES.OK }
      );
      
      this.setCookies(response, accessToken, refreshToken);
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async refresh(req: NextRequest) {
    try {
      const refreshToken = req.cookies.get("refreshToken")?.value;
      
      if (!refreshToken) {
        throw new AppError("Refresh token missing", STATUS_CODES.UNAUTHORIZED);
      }
      
      const tokens = await authService.refresh(refreshToken);
      
      const response = NextResponse.json(
        sendResponse(null, "Token refreshed"),
        { status: STATUS_CODES.OK }
      );
      
      this.setCookies(response, tokens.accessToken, tokens.refreshToken);
      return response;
    } catch (error) {
      const response = this.handleError(error);
      this.clearCookies(response);
      return response;
    }
  }

  async logout(req: NextRequest) {
    try {
      // In a real app we'd get userId from auth middleware via headers, assuming userId is passed
      const userId = req.headers.get("x-user-id"); 
      
      if (userId) {
        await authService.logout(userId);
      }
      
      const response = NextResponse.json(
        sendResponse(null, "Logout successful"),
        { status: STATUS_CODES.OK }
      );
      
      this.clearCookies(response);
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async changePassword(req: NextRequest) {
    try {
      console.log("Headers x-user-id:", req.headers.get("x-user-id"));
console.log("Headers x-user-role:", req.headers.get("x-user-role"));
      const userId = req.headers.get("x-user-id");
      if (!userId) throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);

      const body = await req.json();
      const validatedData = (await import('@/validations/auth.validation')).changePasswordSchema.parse(body);

      await authService.changePassword(userId, validatedData);

      const response = NextResponse.json(
        sendResponse(null, "Password changed successfully. Please login again."),
        { status: STATUS_CODES.OK }
      );
      this.clearCookies(response);
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async forgotPassword(req: NextRequest) {
    try {
      const body = await req.json();
      if (!body.email) throw new AppError("Email is required", STATUS_CODES.BAD_REQUEST);

      await authService.forgotPassword(body.email);

      return NextResponse.json(
        sendResponse(null, "If an account exists with that email, a reset link will be sent."),
        { status: STATUS_CODES.OK }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resetPassword(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = (await import('@/validations/auth.validation')).resetPasswordSchema.parse(body);

      await authService.resetPassword(validatedData);

      return NextResponse.json(
        sendResponse(null, "Password reset successfully"),
        { status: STATUS_CODES.OK }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProfile(req: NextRequest) {
    try {
      const userId = req.headers.get("x-user-id");
      if (!userId) throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);

      const user = await authService.getProfile(userId);

      return NextResponse.json(
        sendResponse(user, "Profile fetched successfully"),
        { status: STATUS_CODES.OK }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProfile(req: NextRequest) {
    try {
      const userId = req.headers.get("x-user-id");
      if (!userId) throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);

      const body = await req.json();
      const validatedData = (await import('@/validations/auth.validation')).updateProfileSchema.parse(body);

      const updatedUser = await authService.updateProfile(userId, validatedData);

      return NextResponse.json(
        sendResponse(updatedUser, "Profile updated successfully"),
        { status: STATUS_CODES.OK }
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async googleLogin(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = (await import('@/validations/auth.validation')).googleLoginSchema.parse(body);

      const { user, accessToken, refreshToken } = await authService.googleLogin(validatedData.idToken);
      
      const response = NextResponse.json(
        sendResponse({ user }, "Google Login successful"),
        { status: STATUS_CODES.OK }
      );
      
      this.setCookies(response, accessToken, refreshToken);
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        sendResponse(null, "Validation Error", error.issues.map((e: z.ZodIssue) => e.message)),
        { status: STATUS_CODES.BAD_REQUEST }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        sendResponse(null, error.message, error.errors),
        { status: error.statusCode }
      );
    }
    
    logger.error("Unhandled controller error:", error);
    return NextResponse.json(
      sendResponse(null, "Internal Server Error"),
      { status: STATUS_CODES.INTERNAL_SERVER_ERROR }
    );
  }
}

export const authController = new AuthController();
