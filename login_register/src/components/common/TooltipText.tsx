'use client';

import React from 'react';
import { Tooltip } from 'antd';
import type { TooltipTextProps } from './types';
import { truncateText } from './helpers/truncateText';
import { CopyButton } from './CopyButton';
import { DEFAULT_TOOLTIP_DELAY } from './constants';
import styles from './styles/TooltipText.module.less';

/**
 * Truncates long text strings with an ellipsis and displays the full text
 * inside an accessible tooltip on hover. Includes an optional copy button.
 */
export const TooltipText: React.FC<TooltipTextProps> = ({
  text,
  maxLength,
  copyable = false,
  tooltipText,
  className = '',
  style,
}) => {
  const truncated = truncateText(text, maxLength);
  const isTruncated = truncated !== text;
  
  // If not truncated and no explicit tooltip requested, just render text
  if (!isTruncated && !tooltipText && !copyable) {
    return <span className={className} style={style}>{text}</span>;
  }

  const title = tooltipText || text;

  return (
    <div className={`${styles.tooltipText} ${className}`} style={style}>
      <Tooltip title={title} mouseEnterDelay={DEFAULT_TOOLTIP_DELAY}>
        <span className={styles.text}>{truncated}</span>
      </Tooltip>
      {copyable && <CopyButton textToCopy={text} />}
    </div>
  );
};
