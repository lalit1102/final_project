"use client";

import Card from "./Card";
import type { StatsCardProps } from "./types";

export default function StatsCard({ value, description, icon, children, ...rest }: StatsCardProps) {
  return (
    <Card {...rest}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
          <div style={{ color: "#8c8c8c" }}>{description}</div>
        </div>
        {icon}
      </div>
      {children}
    </Card>
  );
}
