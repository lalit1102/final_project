'use client';

import React from 'react';
import { Spin } from 'antd';
import type { PageContainerProps } from './types';
import styles from './styles/PageContainer.module.less';

/**
 * Enterprise PageContainer Component.
 * Serves as the primary layout wrapper for all application views,
 * providing consistent padding, responsiveness, loading states, and headers/footers.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  header,
  footer,
  loading = false,
  extra,
  className = '',
  style,
  ...rest
}) => {
  return (
    <div className={`${styles.container} ${className}`} style={style} {...rest}>
      {header && <div className={styles.header}>{header}</div>}
      
      {extra && <div className={styles.extra}>{extra}</div>}
      
      <main className={styles.content}>
        <Spin spinning={loading} size="large">
          {children}
        </Spin>
      </main>
      
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
};
