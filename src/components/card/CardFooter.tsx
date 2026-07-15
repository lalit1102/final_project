"use client";

import type { CardFooterProps } from "./types";

export default function CardFooter({ children, actions, className, style }: CardFooterProps) {
  return (
    <div className={className} style={{ ...style, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <div>{children}</div>
      <div style={{ display: "flex", gap: 8 }}>{actions}</div>
    </div>
  );
}
