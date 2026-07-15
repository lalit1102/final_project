"use client";

import type { TableEmptyProps } from "./types";
import { DEFAULT_TABLE_EMPTY_TEXT } from "./constants";

export default function TableEmpty({ emptyText = DEFAULT_TABLE_EMPTY_TEXT }: TableEmptyProps) {
  return <div>{emptyText}</div>;
}
