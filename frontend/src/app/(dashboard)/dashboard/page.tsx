'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { useAuth } from '@/features/auth/contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Card>
      <Typography.Title level={2}>Dashboard</Typography.Title>
      <Typography.Text>
        Welcome, {user?.name ?? 'User'}
      </Typography.Text>
      <br />
      <Typography.Text type="secondary">
        Role: {user?.role ?? 'N/A'}
      </Typography.Text>
    </Card>
  );
};

export default DashboardPage;
