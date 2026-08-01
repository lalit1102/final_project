"use client";

import type { ReactNode } from "react";
import type { ButtonGroupProps } from "./types";

export default function ButtonGroup({ children, className, style, size }: ButtonGroupProps) {
  return (
    <div className={className} style={style} data-size={size}>
      {children}
    </div>
  );
}
