"use client";

import React from "react";
import { App, ConfigProvider, theme } from "antd";

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const configProps = {
    theme: {
      cssVar: {
        key: "app",
      },
      algorithm: theme.darkAlgorithm,

      components: {
        Layout: {
          bodyBg: "#050505",
          footerBg: "#050505",
          headerBg: "#141414",
          headerColor: "rgba(255,255,255,0.88)",
          siderBg: "#141414",
          triggerBg: "#111111",
          triggerColor: "rgba(255,255,255,0.88)",
        },

        Menu: {
          darkItemBg: "transparent",
          darkItemColor: "rgba(255,255,255,0.68)",
          darkItemHoverBg: "rgba(255,255,255,0.08)",
          darkItemHoverColor: "#fff",
          darkItemSelectedBg: "rgba(22,119,255,0.28)",
          darkItemSelectedColor: "#fff",
          darkSubMenuItemBg: "transparent",
        },

        Progress: {
          circleTextColor: "rgba(255,255,255,0.88)",
          defaultColor: "#1677FF",
          remainingColor: "rgba(255,255,255,0.12)",
        },
      },
    },
  };


  return (
    <ConfigProvider {...configProps}>
      <App>
      {children}
      </App>
    </ConfigProvider>
  );
}