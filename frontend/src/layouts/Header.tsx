"use client";

import { Layout } from "antd";
import type { HeaderProps } from "./types";
import { DEFAULT_LAYOUT_HEADER_HEIGHT } from "./constants";

const { Header: AntHeader } = Layout;

export default function Header({ title, subtitle, actions, children, style, className }: HeaderProps) {
  return (
    <AntHeader className={className} style={{ height: DEFAULT_LAYOUT_HEADER_HEIGHT, padding: "0 16px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
        <div>
          {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}
          {subtitle ? <div style={{ color: "#8c8c8c", fontSize: 12 }}>{subtitle}</div> : null}
        </div>
        <div>{actions}</div>
      </div>
      {children}
    </AntHeader>
  );
}
