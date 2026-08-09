import React from 'react';
import { Spin } from 'antd';
import styles from './LoadingState.module.css';

interface LoadingStateProps {
  tip?: string;
  fullScreen?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  tip = 'Loading...',
  fullScreen = false,
}) => {
  const content = <Spin size="large" tip={tip} />;

  if (fullScreen) {
    return <div className={styles.fullScreenContainer}>{content}</div>;
  }

  return <div className={styles.container}>{content}</div>;
};

export default LoadingState;
