'use client';

import React from 'react';
import { Button, Tooltip, App } from 'antd';
import { CopyOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { CopyButtonProps } from './types';
import { useCopyFeedback } from './hooks/useCopyFeedback';
import styles from './styles/CopyButton.module.less';

/**
 * Reusable Button that copies a provided string to the user's clipboard
 * and displays temporary visual feedback.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label,
  successFeedback = 'Copied!',
  errorFeedback = 'Failed to copy',
  customIcon,
  className = '',
  style,
}) => {
  const { message } = App.useApp();
  const { isCopied, error, copy } = useCopyFeedback();

  const handleCopy = () => {
    copy(textToCopy);
    // Optionally also trigger Ant Design's global message
    message.success(successFeedback);
  };

  const getIcon = () => {
    if (error) return <CloseOutlined style={{ color: 'red' }} />;
    if (isCopied) return <CheckOutlined style={{ color: 'green' }} />;
    return customIcon || <CopyOutlined />;
  };

  return (
    <Tooltip title={isCopied ? successFeedback : 'Copy to clipboard'}>
      <Button 
        type="text" 
        size="small" 
        className={`${styles.copyBtn} ${className}`} 
        style={style}
        onClick={handleCopy}
        icon={getIcon()}
      >
        {label}
      </Button>
    </Tooltip>
  );
};
