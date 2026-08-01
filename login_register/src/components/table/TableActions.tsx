"use client";

import type { TableActionsProps } from "./types";

export default function TableActions({ actions = [] }: TableActionsProps) {
  return <div style={{ display: "flex", gap: 8 }}>{actions}</div>;
}
