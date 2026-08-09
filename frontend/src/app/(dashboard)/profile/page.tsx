'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { ProfileView } from '@/features/profile';
import PageContainer from '@/components/common/PageContainer';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <Card>
        <Typography.Title level={2}>Profile</Typography.Title>
        <ProfileView user={user} />
      </Card>
    </PageContainer>
  );
};

export default ProfilePage;
