import type { TableProps, TablePaginationConfig, TableColumnType } from "antd";
import type { ReactNode } from "react";

export interface BaseTableProps<RecordType extends object = Record<string, unknown>>
  extends Omit<TableProps<RecordType>, "columns" | "title" | "pagination"> {
  columns?: Array<TableColumnType<RecordType>>;
  title?: ReactNode;
  toolbar?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  pagination?: TablePaginationConfig | false;
  serverPagination?: boolean;
  selection?: boolean;
  exportable?: boolean;
  emptyText?: ReactNode;
}

export interface TableToolbarProps {
  children?: ReactNode;
  actions?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  exportable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface TableSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export interface TableFilterProps {
  children?: ReactNode;
}

export interface TablePaginationProps extends TablePaginationConfig {
  total?: number;
}

export interface TableActionsProps {
  actions?: ReactNode[];
  row?: Record<string, unknown>;
}

export interface TableEmptyProps {
  emptyText?: ReactNode;
}
