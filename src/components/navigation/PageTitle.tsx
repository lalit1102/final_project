'use client';

import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export interface PageTitleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standardized Page Title component to ensure consistent typography
 * across all enterprise views.
 */
export const PageTitle: React.FC<PageTitleProps> = ({
  title,
  subtitle,
  className,
  style,
}) => {
  return (
    <div className={className} style={{ marginBottom: 16, ...style }}>
      <Title level={2} style={{ margin: 0 }}>
        {title}
      </Title>
      {subtitle && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          {subtitle}
        </Typography.Text>
      )}
    </div>
  );
};
