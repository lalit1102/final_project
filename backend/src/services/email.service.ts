export const emailService = {
  async sendPasswordResetEmail(email: string, token: string) {
    console.info(`Password reset requested for ${email}. Token: ${token}`);
    return { email, token };
  },
};
