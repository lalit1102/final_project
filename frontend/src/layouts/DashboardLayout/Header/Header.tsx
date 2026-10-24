"use client";

import React from 'react';
import { Layout, Button, Dropdown, Avatar, theme, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import styles from './Header.module.css';
import type { MenuProps } from 'antd';
import type { User } from '@/types/auth';

const { Header: AntHeader } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  onLogout?: () => void;
  user?: User | null;
}

export const Header: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  isMobile,
  onLogout,
  user,
}) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout,
      danger: true,
    },
  ];

  return (
    <AntHeader
      className={styles.header}
      style={{ background: colorBgContainer }}
    >
      <div className={styles.leftContent}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          className={styles.trigger}
        />
      </div>

      <div className={styles.rightContent}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space className={styles.userDropdown}>
            <Avatar icon={<UserOutlined />} />
            {!isMobile && (
              <span className={styles.userName}>{user?.name || 'User'}</span>
            )}
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  );
};
