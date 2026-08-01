'use client';

import React from 'react';
import { Divider as AntDivider } from 'antd';
import type { DividerProps } from './types';
import styles from './styles/Divider.module.less';

/**
 * Standardized Divider.
 * Wraps Ant Design's Divider to apply enterprise spacing consistently.
 */
export const Divider: React.FC<DividerProps> = ({ className = '', ...rest }) => {
  return <AntDivider className={`${styles.divider} ${className}`} {...rest} />;
};
