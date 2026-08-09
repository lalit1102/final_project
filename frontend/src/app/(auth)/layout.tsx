import React from 'react';
import styles from './layout.module.css';

const AuthLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      <main className={styles.authMain}>{children}</main>
    </div>
  );
};

export default AuthLayout;
