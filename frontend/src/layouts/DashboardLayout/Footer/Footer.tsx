import React from 'react';
import { Layout } from 'antd';
import styles from './Footer.module.css';

const { Footer: AntFooter } = Layout;

export const Footer: React.FC = () => {
  return (
    <AntFooter className={styles.footer}>
      LearnSphere LMS ©{new Date().getFullYear()} Created by Enterprise Education Inc.
    </AntFooter>
  );
};
