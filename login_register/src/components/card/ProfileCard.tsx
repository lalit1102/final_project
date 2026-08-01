"use client";

import Card from "./Card";
import type { ProfileCardProps } from "./types";

export default function ProfileCard({ avatar, name, role, meta, children, ...rest }: ProfileCardProps) {
  return (
    <Card {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {avatar}
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ color: "#8c8c8c" }}>{role}</div>
          {meta ? <div style={{ fontSize: 12, color: "#8c8c8c" }}>{meta}</div> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}
