"use client";

import Drawer from "./Drawer";
import type { FormDrawerProps } from "./types";

export default function FormDrawer({ form, children, ...rest }: FormDrawerProps) {
  return <Drawer {...rest}>{form ?? children}</Drawer>;
}
