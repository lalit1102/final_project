'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export interface BackButtonProps {
  label?: React.ReactNode;
  onClick?: () => void;
  fallbackPath?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A standard Back Button for enterprise layouts.
 * Integrates with Next.js router.back() but supports overrides.
 */
export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  onClick,
  fallbackPath,
  className,
  style,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (window.history.length > 1) {
      router.back();
    } else if (fallbackPath) {
      router.push(fallbackPath);
    } else {
      router.push('/');
    }
  };

  return (
    <Button
      type="text"
      icon={<ArrowLeftOutlined />}
      onClick={handleBack}
      className={className}
      style={{ paddingLeft: 0, ...style }}
    >
      {label}
    </Button>
  );
};
