import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Breadcrumb.module.css';
import { HomeOutlined } from '@ant-design/icons';

export const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/') return null;

  const pathSnippets = pathname.split('/').filter((i) => i);

  const breadcrumbItems = [
    {
      title: (
        <Link href="/">
          <HomeOutlined />
        </Link>
      ),
      key: 'home',
    },
    ...pathSnippets.map((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;
      
      // Basic formatting for breadcrumb names
      const title = snippet.charAt(0).toUpperCase() + snippet.slice(1).replace(/-/g, ' ');

      return {
        title: isLast ? title : <Link href={url}>{title}</Link>,
        key: url,
      };
    }),
  ];

  return (
    <div className={styles.breadcrumbContainer}>
      <AntBreadcrumb items={breadcrumbItems} />
    </div>
  );
};
