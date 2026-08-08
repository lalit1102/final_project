"use client";

import { Layout } from "antd";
import type { MainLayoutProps } from "./types";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useState } from "react";

import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Logo from "@/components/logo/logo";

const { Content } = Layout;

export default function DashboardLayout({
  children,
  header,
  sidebar,
  footer,
  breadcrumb,
  className,
  style,
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/dashboard/profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "/dashboard/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];
  return (
    <Layout>
      <Sidebar collapsed={collapsed} items={sidebarItems}>
         <Logo collapsed={collapsed} />
      </Sidebar>

      <Layout>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)}>
          {header}
        </Header>

        <Content>
          {breadcrumb}
          {children}
        </Content>
        <Footer>{footer}</Footer>
      </Layout>
    </Layout>
  );
}
