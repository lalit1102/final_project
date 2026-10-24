import React from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  BookOutlined,
  StarOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';

/**
 * Maps string keys to Ant Design Icons.
 * This ensures our configuration files remain serializable and clean,
 * separating UI rendering from data structure.
 */
export const iconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  user: <UserOutlined />,
  setting: <SettingOutlined />,
  team: <TeamOutlined />,
  book: <BookOutlined />,
  star: <StarOutlined />,
  'credit-card': <CreditCardOutlined />,
};

export const getIcon = (iconKey?: string): React.ReactNode => {
  if (!iconKey) return null;
  return iconMap[iconKey] || null;
};
