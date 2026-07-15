'use client';

import React from 'react';
import { Breadcrumb, type BreadcrumbProps } from './Breadcrumb';
import { BackButton, type BackButtonProps } from './BackButton';
import { PageTitle, type PageTitleProps } from './PageTitle';
import styles from './PageHeader.module.less';
import type { NavItem } from './types';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  
  /**
   * Providing menu structure will automatically generate breadcrumbs
   */
  menuItems?: NavItem[];
  
  showBack?: boolean;
  backProps?: Omit<BackButtonProps, 'label'>;
  
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enterprise Page Header component.
 * Combines Breadcrumbs, Page Title, Back Button, and action areas into a unified,
 * reusable layout component that sits at the top of application views.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  menuItems,
  showBack = false,
  backProps,
  extra,
  className,
  style,
}) => {
  return (
    <div className={`${styles.pageHeader} ${className || ''}`} style={style}>
      {menuItems && menuItems.length > 0 && (
        <Breadcrumb items={menuItems} />
      )}
      
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          {showBack && (
            <div className={styles.backButtonWrapper}>
              <BackButton {...backProps} label="" />
            </div>
          )}
          <PageTitle title={title} subtitle={subtitle} style={{ marginBottom: 0 }} />
        </div>

        {extra && (
          <div className={styles.extraContent}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};
