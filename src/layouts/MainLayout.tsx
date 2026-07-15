"use client";

import { Layout } from "antd";
import type { MainLayoutProps } from "./types";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const { Content } = Layout;

export default function MainLayout({ children, header, sidebar, footer, breadcrumb, className, style }: MainLayoutProps) {
  return (
    <Layout className={className} style={{ minHeight: "100vh", ...style }}>
      <Sidebar>{sidebar}</Sidebar>
      <Layout>
        <Header>{header}</Header>
        <Content style={{ padding: 16 }}>
          {breadcrumb}
          {children}
        </Content>
        <Footer>{footer}</Footer>
      </Layout>
    </Layout>
  );
}
