'use client';

import React from 'react';
import { Badge as AntBadge } from 'antd';
import type { BadgeProps } from './types';
import { DEFAULT_BADGE_OVERFLOW } from './constants';
import styles from './styles/Badge.module.less';

/**
 * Enterprise Badge Component.
 * Wraps Ant Design's Badge to ensure consistent overflow limits and status bindings.
 */
export const Badge: React.FC<BadgeProps> = ({
  overflowCount = DEFAULT_BADGE_OVERFLOW,
  className = '',
  ...rest
}) => {
  return (
    <span className={`${styles.badgeWrapper} ${className}`}>
      <AntBadge overflowCount={overflowCount} {...rest} />
    </span>
  );
};
