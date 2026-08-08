"use client";

import { Layout, Button, Space, Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

import type { HeaderProps } from "./types";
import { DEFAULT_LAYOUT_HEADER_HEIGHT } from "./constants";

const { Header: AntHeader } = Layout;

export default function Header({
  title,
  subtitle,
  actions,
  children,
  collapsed,
  onToggle,
  style,
  className,
}: HeaderProps) {
  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    switch (key) {
      case "profile":
        console.log("Profile");
        break;

      case "logout":
        console.log("Logout");
        break;

      default:
        break;
    }
  };

  return (
    <AntHeader
      className={className}
      style={{
        height: DEFAULT_LAYOUT_HEADER_HEIGHT,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--ant-color-border)",
        ...style,
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          onClick={onToggle}
          icon={
            collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <MenuFoldOutlined />
            )
          }
        />

        <div>
          {title && (
            <div
              style={{
                fontWeight: 600,
                color: "var(--ant-color-text)",
              }}
            >
              {title}
            </div>
          )}

          {subtitle && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ant-color-text-secondary)",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </Space>

      <Space size="middle">
        {actions}

        <Dropdown
          menu={{
            items: menuItems,
            onClick: handleMenuClick,
          }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            icon={<UserOutlined />}
            style={{ cursor: "pointer" }}
          />
        </Dropdown>
      </Space>

      {children}
    </AntHeader>
  );
}