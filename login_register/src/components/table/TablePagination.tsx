"use client";

import { Pagination } from "antd";
import type { TablePaginationProps } from "./types";

export default function TablePagination(props: TablePaginationProps) {
  return <Pagination {...props} />;
}
