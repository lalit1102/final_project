'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { useChangePassword } from '@/hooks/auth/useChangePassword';
import { ChangePasswordForm } from '@/features/profile';
import PageContainer from '@/components/common/PageContainer';

const ChangePasswordPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const changePassword = useChangePassword();
  const notification = useNotification();

  const handleChangePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    await changePassword.execute({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    } as never);
  };

  useEffect(() => {
    if (changePassword.isSuccess) {
      notification.success('Password changed successfully. Please log in again.');

      void logout();
      router.replace('/login');
    }

    if (changePassword.isError && changePassword.error) {
      const status = changePassword.error.response?.status;
      if (status === 400) {
        notification.error('Incorrect current password.');
      } else {
        notification.error('Failed to change password.');
      }
    }
  }, [changePassword.isSuccess, changePassword.isError, changePassword.error, notification, logout, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <ChangePasswordForm
        onSubmit={handleChangePassword}
        isLoading={changePassword.isLoading}
      />
    </PageContainer>
  );
};

export default ChangePasswordPage;
