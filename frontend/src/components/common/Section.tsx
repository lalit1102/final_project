'use client';

import React, { useState } from 'react';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import type { SectionProps } from './types';
import styles from './styles/Section.module.less';

/**
 * Enterprise Section Component.
 * Used to group related content within a PageContainer.
 * Supports dividers, descriptions, and collapsible behaviors.
 */
export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  divider = false,
  collapsible = false,
  defaultExpanded = true,
  extra,
  padding = 'middle',
  className = '',
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return styles.contentNone;
      case 'small': return styles.contentSmall;
      case 'large': return styles.contentLarge;
      case 'middle':
      default:
        return styles.contentMiddle;
    }
  };

  return (
    <section className={`${styles.section} ${className}`} style={style}>
      {(title || extra || collapsible) && (
        <div 
          className={`${styles.header} ${divider ? styles.headerWithDivider : ''} ${collapsible ? styles.headerCollapsible : ''}`}
          onClick={toggleExpand}
          role={collapsible ? 'button' : undefined}
          aria-expanded={collapsible ? isExpanded : undefined}
        >
          <div className={styles.titleArea}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {description && <p className={styles.description}>{description}</p>}
          </div>

          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {extra}
            {collapsible && (
              <span className={styles.collapseIcon}>
                {isExpanded ? <UpOutlined /> : <DownOutlined />}
              </span>
            )}
          </div>
        </div>
      )}
      
      {(!collapsible || isExpanded) && (
        <div className={getPaddingClass()}>
          {children}
        </div>
      )}
    </section>
  );
};
