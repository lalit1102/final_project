'use client';

import React from 'react';
import { Avatar, Button, Card, Grid, Space, Tag, Typography } from 'antd';
import {
  EditOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { ProfileViewProps } from '../types';
import styles from './ProfileView.module.css';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  const router = useRouter();
  const { md } = Grid.useBreakpoint();

  const handleEdit = () => {
    router.push('/dashboard/profile/edit');
  };

  const handleChangePassword = () => {
    router.push('/dashboard/profile/change-password');
  };

  if (!user) {
    return (
      <Card>
        <Typography.Text type="secondary">No user data available</Typography.Text>
      </Card>
    );
  }

  const avatarSrc = user.avatar ?? undefined;
  const roleLabel = roleLabels[user.role] ?? user.role;
  const isMobile = !md;

  return (
    <Card className={styles.profileCard}>
      <div className={styles.profileContent}>
        <div className={styles.profileHeader}>
          <Avatar
            src={avatarSrc}
            icon={!avatarSrc && <UserOutlined />}
            alt={user.name}
            size={isMobile ? 64 : 80}
          />
          <div className={styles.profileName}>
            <Typography.Title level={isMobile ? 4 : 3} className={styles.title}>
              {user.name}
            </Typography.Title>
            <Tag color="blue" className={styles.roleTag}>
              {roleLabel}
            </Tag>
          </div>
        </div>

        <Typography.Text type="secondary" className={styles.email}>
          {user.email}
        </Typography.Text>

        <Space orientation="vertical" className={styles.actions} size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            aria-label="Edit profile"
          >
            Edit Profile
          </Button>
          <Button
            icon={<LockOutlined />}
            onClick={handleChangePassword}
            aria-label="Change password"
          >
            Change Password
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default ProfileView;
