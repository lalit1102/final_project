'use client';

import React, { useState } from 'react';
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
import ConfirmDialog from '@/components/common/ConfirmDialog/ConfirmDialog';
import styles from './UserMenu.module.css';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();

  const sidebarCollapsed = useAppSelector((state) => state.ui.sidebarCollapsed);

  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const handleOpenConfirm = () => {
    setConfirmOpen(true);
  };

  const handleCancelLogout = () => {
    setConfirmOpen(false);
  };

  const handleLogout = async () => {
    setConfirmOpen(false);
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
      onClick: handleOpenConfirm,
    },
  ];

  const avatarSrc = userObj?.avatar ?? undefined;

   return (
     <React.Fragment>
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

      <ConfirmDialog
        open={isConfirmOpen}
        title="Confirm Logout"
        content="Are you sure you want to log out? Your session will be permanently ended."
        okText="Logout"
        cancelText="Cancel"
        okButtonDanger
        onConfirm={handleLogout}
        onCancel={handleCancelLogout}
      />
    </React.Fragment>
   );
 };

export default UserMenu;
