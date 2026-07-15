"use client";

import Drawer from "./Drawer";
import type { DetailDrawerProps } from "./types";

export default function DetailDrawer({ details, children, ...rest }: DetailDrawerProps) {
  return <Drawer {...rest}>{details ?? children}</Drawer>;
}
