import type {
  ColumnsType,
  TablePaginationConfig,
  TableProps,
} from 'antd/es/table';
import type {
  TableCurrentDataSource,
  TableLocale,
  SorterResult,
} from 'antd/es/table/interface';

export type {
  ColumnsType,
  TableCurrentDataSource,
  TableLocale,
  TablePaginationConfig,
  TableProps,
  SorterResult,
};

export interface DataTableProps<T>
  extends Omit<TableProps<T>, 'rowKey' | 'loading'> {
  columns: ColumnsType<T>;
  dataSource: T[];
  rowKey?: string | TableProps<T>['rowKey'];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}
