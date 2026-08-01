import type { TablePaginationConfig } from "antd";
import { DEFAULT_TABLE_PAGE_SIZE } from "../constants";

export function getTablePagination(pagination?: TablePaginationConfig | false) {
  if (pagination === false) {
    return false;
  }

  return {
    pageSize: DEFAULT_TABLE_PAGE_SIZE,
    ...pagination,
  };
}
