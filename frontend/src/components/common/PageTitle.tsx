'use client';

import React from 'react';
import { Typography } from 'antd';
import type { PageTitleProps } from './types';
import { StatusTag } from './StatusTag';
import styles from './styles/PageTitle.module.less';
import { usePageTitle } from './hooks/usePageTitle';

const { Title, Text } = Typography;

/**
 * Standardized Page Title component with integrated Status support
 * and Document Title syncing.
 */
export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  description,
  status,
  extra,
  className = '',
  style,
}) => {
  // Automatically sync the document title if title is a string
  usePageTitle(typeof title === 'string' ? title : undefined);

  return (
    <div className={`${styles.titleContainer} ${className}`} style={style}>
      <div className={styles.titleMain}>
        <div className={styles.titleRow}>
          <Title level={2} className={styles.titleText}>
            {title}
          </Title>
          {status && <StatusTag status={status} />}
        </div>
        
        {subtitle && (
          <Text className={styles.subtitle}>{subtitle}</Text>
        )}
        
        {description && (
          <Text className={styles.description}>{description}</Text>
        )}
      </div>

      {extra && <div className={styles.extra}>{extra}</div>}
    </div>
  );
};
