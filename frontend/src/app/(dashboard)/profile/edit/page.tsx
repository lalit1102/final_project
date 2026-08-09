'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import { ProfileForm } from '@/features/profile';
import PageContainer from '@/components/common/PageContainer';

const ProfileEditPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const notification = useNotification();

  const handleUpdate = async (data: { name: string; avatar: string }) => {
    await updateProfile.execute({
      name: data.name,
      avatar: data.avatar || undefined,
    } as never);

    if (updateProfile.isSuccess) {
      await refreshUser();
      notification.success('Profile updated successfully.');
      router.push('/dashboard/profile');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/profile');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <ProfileForm
        initialName={user?.name ?? ''}
        initialAvatar={user?.avatar ?? null}
        onSubmit={handleUpdate}
        isLoading={updateProfile.isLoading}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};

export default ProfileEditPage;
