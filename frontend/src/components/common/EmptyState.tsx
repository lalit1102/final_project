import React from 'react';
import { Empty, Typography } from 'antd';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title: _title,
  description = 'There is nothing to display here.',
}) => {
  return (
    <div className={styles.emptyContainer}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className={styles.emptyContent}>
            <Typography.Text type="secondary" className={styles.emptyDescription}>
              {description}
            </Typography.Text>
          </div>
        }
      />
    </div>
  );
};

export default EmptyState;
