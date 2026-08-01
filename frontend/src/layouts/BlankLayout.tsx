"use client";

import { Layout } from "antd";
import type { BaseLayoutProps } from "./types";

const { Content } = Layout;

export default function BlankLayout({ children, className, style }: BaseLayoutProps) {
  return (
    <Layout className={className} style={{ minHeight: "100vh", ...style }}>
      <Content>{children}</Content>
    </Layout>
  );
}
