"use client";

import { Table as AntTable } from "antd";
import type { BaseTableProps } from "./types";
import { DEFAULT_TABLE_EMPTY_TEXT } from "./constants";
import { useTablePagination } from "./hooks";

export default function Table<RecordType extends object = Record<string, unknown>>({
  columns,
  title,
  toolbar,
  search,
  filters,
  pagination,
  emptyText = DEFAULT_TABLE_EMPTY_TEXT,
  ...rest
}: BaseTableProps<RecordType>) {
  const resolvedPagination = useTablePagination(pagination);

  return (
    <div>
      {(toolbar || search || filters) ? (
        <div style={{ marginBottom: 12 }}>
          {toolbar}
          {search}
          {filters}
        </div>
      ) : null}
      <AntTable<RecordType>
        {...rest}
        columns={columns}
        title={() => title}
        pagination={resolvedPagination}
        locale={{ emptyText }}
      />
    </div>
  );
}
