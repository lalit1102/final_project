"use client";

import type { TableToolbarProps } from "./types";

export default function TableToolbar({ children, actions, search, filters, className, style }: TableToolbarProps) {
  return (
    <div className={className} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, ...style }}>
      <div style={{ display: "flex", gap: 12, flex: 1 }}>{children}{search}{filters}</div>
      <div>{actions}</div>
    </div>
  );
}
