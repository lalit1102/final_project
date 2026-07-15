"use client";

import { Drawer as AntDrawer, Spin } from "antd";
import type { BaseDrawerProps } from "./types";
import { DEFAULT_DRAWER_PLACEMENT, DEFAULT_DRAWER_WIDTH } from "./constants";

export default function Drawer({
  children,
  title,
  open,
  loading,
  width = DEFAULT_DRAWER_WIDTH,
  placement = DEFAULT_DRAWER_PLACEMENT,
  ...rest
}: BaseDrawerProps) {
  return (
    <AntDrawer {...rest} open={open} title={title} width={width} placement={placement}>
      {loading ? <Spin tip="Loading...">{children}</Spin> : children}
    </AntDrawer>
  );
}
