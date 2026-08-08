"use client";

import { Layout, Menu } from "antd";
import { usePathname, useRouter } from "next/navigation";
import type { SidebarProps } from "./types";
import {
  DEFAULT_LAYOUT_SIDEBAR_COLLAPSED_WIDTH,
  DEFAULT_LAYOUT_SIDEBAR_WIDTH,
} from "./constants";
import styles from "./Sidebar.module.css";
const { Sider } = Layout;

export default function Sidebar({
  collapsed = false,
  items = [],
  children,
  style,
  className,
}: SidebarProps) {
  const pathname = usePathname();
const router = useRouter();
  return (
    <Sider
      className={`${styles.sider} ${className ?? ""}`}
      width={DEFAULT_LAYOUT_SIDEBAR_WIDTH}
      collapsedWidth={DEFAULT_LAYOUT_SIDEBAR_COLLAPSED_WIDTH}
      collapsed={collapsed}
      style={{
        ...style,
      }}
    >
      <div className={styles.logo}>
        {children}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[pathname]}
        onClick={({ key }) => router.push(key)}
      />

    </Sider>
  );
}