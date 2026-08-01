"use client";

import Card from "./Card";
import type { EmptyCardProps } from "./types";
import { DEFAULT_EMPTY_TEXT } from "./constants";

export default function EmptyCard({ emptyText = DEFAULT_EMPTY_TEXT, children, ...rest }: EmptyCardProps) {
  return (
    <Card {...rest}>
      <div style={{ textAlign: "center", color: "#8c8c8c" }}>{emptyText}</div>
      {children}
    </Card>
  );
}
