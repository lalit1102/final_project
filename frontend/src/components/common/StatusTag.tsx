import React from 'react';
import { Tag, type TagProps } from 'antd';
import styles from './StatusTag.module.css';

interface StatusTagProps {
  status: string | number;
  label?: string;
  variant?: 'dot' | 'text' | 'filled';
  bordered?: boolean;
}

const statusPresetMap: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  pending: 'processing',
  draft: 'warning',
  archived: 'default',
  published: 'success',
  error: 'error',
  success: 'success',
  warning: 'warning',
  info: 'processing',
  default: 'default',
};

const StatusTag: React.FC<StatusTagProps> = ({
  status,
  label,
  variant = 'filled',
  bordered = false,
}) => {
  const preset = statusPresetMap[String(status).toLowerCase()] ?? 'default';

  const tagProps: TagProps = {
    bordered,
    className: styles.statusTag,
  };

  if (variant === 'dot') {
    tagProps.className = `${styles.statusTag} ${styles.dot}`;
  }

  const displayLabel = label ?? status;

  return (
    <Tag {...tagProps} color={preset}>
      {displayLabel}
    </Tag>
  );
};

export default StatusTag;
