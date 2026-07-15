"use client";

import { Input } from "antd";
import type { TableSearchProps } from "./types";
import { DEFAULT_TABLE_SEARCH_PLACEHOLDER } from "./constants";

export default function TableSearch({ value, onChange, placeholder = DEFAULT_TABLE_SEARCH_PLACEHOLDER }: TableSearchProps) {
  return <Input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} />;
}
