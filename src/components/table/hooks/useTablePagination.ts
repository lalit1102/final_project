"use client";

import { useMemo } from "react";
import { getTablePagination } from "../helpers";
import type { TablePaginationConfig } from "antd";

export function useTablePagination(pagination?: TablePaginationConfig | false) {
  return useMemo(() => getTablePagination(pagination), [pagination]);
}
