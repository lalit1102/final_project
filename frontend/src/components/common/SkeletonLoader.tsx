import React from 'react';
import { Skeleton, Grid } from 'antd';
import type { SkeletonProps } from 'antd';
import styles from './SkeletonLoader.module.css';

export type SkeletonVariant =
  | 'default'
  | 'card'
  | 'list'
  | 'profile'
  | 'form';

interface SkeletonLoaderProps extends Omit<SkeletonProps, 'children'> {
  variant?: SkeletonVariant;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'default',
  count = 1,
  ...props
}) => {
  const { md } = Grid.useBreakpoint();
  const isMobile = !md;

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Skeleton
            loading={true}
            active
            paragraph={{ rows: 4 }}
            title={{ width: '60%' }}
            styles={{
              section: { minHeight: isMobile ? 140 : 180 },
            }}
            {...props}
          />
        );

      case 'list': {
        const listItems = Array.from({ length: count }).map((_, index) => (
          <Skeleton
            key={`list-item-${index}`}
            loading={true}
            active
            paragraph={{ rows: 2 }}
            title={{ width: '80%' }}
            styles={{
              section: { minHeight: 50 },
            }}
            style={{ marginBottom: 12 }}
          />
        ));
        return <>{listItems}</>;
      }

      case 'profile':
        return (
          <Skeleton
            loading={true}
            active
            paragraph={{ rows: 3 }}
            title={{ width: '40%' }}
            avatar={{ size: isMobile ? 64 : 80, shape: 'circle' }}
            styles={{
              section: { minHeight: isMobile ? 140 : 180 },
            }}
            {...props}
          />
        );

      case 'form':
        return (
          <Skeleton
            loading={true}
            active
            paragraph={{ rows: 5 }}
            title={{ width: '30%' }}
            styles={{
              section: { minHeight: isMobile ? 280 : 320 },
            }}
            {...props}
          />
        );

      default:
        return (
          <Skeleton
            loading={true}
            active
            paragraph={{ rows: count }}
            title={{ width: '100%' }}
            {...props}
          />
        );
    }
  };

  return <div className={styles.skeletonLoader}>{renderSkeleton()}</div>;
};

export default SkeletonLoader;
