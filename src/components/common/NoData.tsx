'use client';

import React from 'react';
import { Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { NoDataProps } from './types';
import styles from './styles/NoData.module.less';

/**
 * Reusable Empty State component.
 * Shown when tables, lists, or sections have no data to display.
 */
export const NoData: React.FC<NoDataProps> = ({
  title = 'No Data Found',
  description = 'There is currently no data available to display here.',
  icon = <InboxOutlined />,
  illustration,
  actionText,
  onRetry,
  className = '',
  style,
}) => {
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <div className={styles.illustration}>
        {illustration || icon}
      </div>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>
      
      {actionText && onRetry && (
        <Button type="primary" onClick={onRetry}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
