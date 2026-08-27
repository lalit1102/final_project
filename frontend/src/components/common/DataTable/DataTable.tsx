import React from 'react';
import { Grid, Table } from 'antd';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import type { DataTableProps } from './DataTable.types';
import styles from './DataTable.module.css';

function useResponsiveScroll(): boolean {
  const { md } = Grid.useBreakpoint();
  return !md;
}

function DataTable<T extends Record<string, any>>(
  props: DataTableProps<T>,
): React.ReactElement | null {
  const {
    columns,
    dataSource,
    rowKey,
    loading = false,
    error = null,
    onRetry,
    emptyTitle,
    emptyDescription,
    scroll,
    ...restProps
  } = props;

  const isMobile = useResponsiveScroll();

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        description={error.message || 'An error occurred while fetching data.'}
        onRetry={onRetry}
        retryLabel="Retry"
      />
    );
  }

  if (loading) {
    return <LoadingState tip="Loading..." />;
  }

  if (dataSource.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  const scrollConfig = scroll ?? (isMobile ? { x: true } : undefined);

  return (
    <div className={styles.dataTableContainer}>
      <Table<T>
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        scroll={scrollConfig}
        pagination={{
          pageSizeOptions: [10, 20, 50, 100],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `Total ${total} records`,
          ...restProps.pagination,
        }}
        locale={{
          emptyText: <EmptyState description="No records found." />,
          ...restProps.locale,
        }}
        {...restProps}
      />
    </div>
  );
}

export default DataTable;
