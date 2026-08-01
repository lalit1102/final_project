import { logger } from "@/utils/logger";

export class EmailService {
  async sendPasswordResetEmail(email: string, token: string) {
    // In production, integrate with SendGrid, SES, Resend, etc.
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    logger.info(`[EmailService] Sending password reset email to ${email}. Link: ${resetLink}`);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    logger.info(`[EmailService] Sending verification email to ${email}. Link: ${verifyLink}`);
  }
}

export const emailService = new EmailService();
