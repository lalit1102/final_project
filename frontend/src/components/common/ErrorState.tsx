import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading data.',
  onRetry,
  retryLabel = 'Retry',
}) => {
  return (
    <div className={styles.errorContainer}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 60 }}
        description={
          <div className={styles.errorContent}>
            <Typography.Text type="danger" className={styles.errorTitle}>
              {title}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.errorDescription}>
              {description}
            </Typography.Text>
            {onRetry && (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetry}
                className={styles.retryButton}
              >
                {retryLabel}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default ErrorState;
