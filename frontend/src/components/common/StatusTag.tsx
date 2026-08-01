'use client';

import React from 'react';
import { Tag } from 'antd';
import type { StatusTagProps } from './types';
import { formatStatus } from './helpers/formatStatus';
import { useStatusColor } from './hooks/useStatusColor';
import styles from './styles/StatusTag.module.less';

/**
 * Semantic Status Tag.
 * Automatically maps standard business statuses to correct colors and formats.
 */
export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  text,
  icon,
  dynamicColor,
  className = '',
  style,
}) => {
  const color = useStatusColor(status, dynamicColor);
  
  // If text is not explicitly provided, format the status string
  const displayText = text || formatStatus(status);

  return (
    <Tag 
      color={color} 
      className={`${styles.tag} ${className}`} 
      style={style}
      icon={icon && <span className={styles.icon}>{icon}</span>}
    >
      {displayText}
    </Tag>
  );
};
