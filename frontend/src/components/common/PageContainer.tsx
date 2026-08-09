import React from 'react';
import styles from './PageContainer.module.css';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className }) => {
  return (
    <div className={`${styles.pageContainer} ${className ?? ''}`}>
      {children}
    </div>
  );
};

export default PageContainer;
