'use client';

import React from 'react';
import { Avatar, Dropdown, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/hooks/storeHooks';
import { toggleSidebar } from '@/store/slices';
import type { User } from '@/types/user';
import styles from './UserMenu.module.css';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();

  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* Logout failures are handled by AuthContext */
    }
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const userObj: User | null = user;

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: userObj?.name ?? 'My Account',
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'sidebar-toggle',
      icon: <SettingOutlined />,
      label: sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
      onClick: handleToggleSidebar,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const avatarSrc = userObj?.avatar ?? undefined;

  return (
    <Dropdown
      menu={{ items }}
      placement="bottomRight"
      arrow
      trigger={['click']}
    >
      <Space className={styles.userMenu} size="middle" onClick={(e) => e.preventDefault()}>
        <Typography.Text className={styles.userName} type="secondary">
          {userObj?.name ?? 'User'}
        </Typography.Text>
        <Avatar
          src={avatarSrc}
          icon={!avatarSrc && <UserOutlined />}
          alt={userObj?.name ?? 'User avatar'}
          size="default"
        />
      </Space>
    </Dropdown>
  );
};

export default UserMenu;
