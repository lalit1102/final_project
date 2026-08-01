"use client";

import { Layout } from "antd";
import type { BaseLayoutProps } from "./types";

const { Content } = Layout;

export default function AuthLayout({ children, className, style }: BaseLayoutProps) {
  return (
    <Layout className={className} style={{ minHeight: "100vh", ...style }}>
      <Content style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {children}
      </Content>
    </Layout>
  );
}
