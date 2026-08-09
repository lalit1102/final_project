'use client';

import React from 'react';
import { Typography } from 'antd';
import styles from './Footer.module.css';

const DashboardFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <Typography.Text type="secondary" className={styles.footerText}>
        © {year} LearnSphere
      </Typography.Text>
    </footer>
  );
};

export default DashboardFooter;
