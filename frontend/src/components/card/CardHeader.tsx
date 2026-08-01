"use client";

import type { CardHeaderProps } from "./types";

export default function CardHeader({ title, subtitle, extra, actions, className, style }: CardHeaderProps) {
  return (
    <div className={className} style={style}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}
          {subtitle ? <div style={{ color: "#8c8c8c", fontSize: 12 }}>{subtitle}</div> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
          {extra}
        </div>
      </div>
    </div>
  );
}
