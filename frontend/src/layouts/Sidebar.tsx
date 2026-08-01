"use client";

import { Layout, Menu } from "antd";
import type { SidebarProps } from "./types";
import { DEFAULT_LAYOUT_SIDEBAR_COLLAPSED_WIDTH, DEFAULT_LAYOUT_SIDEBAR_WIDTH } from "./constants";

const { Sider } = Layout;

export default function Sidebar({ collapsed = false, items = [], children, style, className }: SidebarProps) {
  return (
    <Sider
      className={className}
      style={{ width: collapsed ? DEFAULT_LAYOUT_SIDEBAR_COLLAPSED_WIDTH : DEFAULT_LAYOUT_SIDEBAR_WIDTH, ...style }}
      collapsed={collapsed}
      collapsedWidth={DEFAULT_LAYOUT_SIDEBAR_COLLAPSED_WIDTH}
    >
      <div style={{ padding: 16 }}>{children}</div>
      <Menu items={items} mode="inline" defaultSelectedKeys={[items[0]?.key ?? ""]} />
    </Sider>
  );
}
