import type { CSSProperties } from "react";

export function getLayoutContentStyle(collapsed: boolean | undefined): CSSProperties {
  return {
    marginLeft: collapsed ? 80 : 240,
    transition: "margin-left 0.2s ease",
  };
}
