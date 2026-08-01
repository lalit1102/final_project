"use client";

import Card from "./Card";
import type { InfoCardProps } from "./types";

export default function InfoCard({ label, content, children, ...rest }: InfoCardProps) {
  return (
    <Card {...rest}>
      <div>
        <div style={{ color: "#8c8c8c", marginBottom: 4 }}>{label}</div>
        <div style={{ fontWeight: 600 }}>{content}</div>
      </div>
      {children}
    </Card>
  );
}
