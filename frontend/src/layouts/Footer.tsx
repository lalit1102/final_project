"use client";

import { Layout } from "antd";
import type { FooterProps } from "./types";
import { DEFAULT_LAYOUT_FOOTER_HEIGHT } from "./constants";

const { Footer: AntFooter } = Layout;

export default function Footer({ copyright, children, style, className }: FooterProps) {
  return (
    <AntFooter className={className} style={{ height: DEFAULT_LAYOUT_FOOTER_HEIGHT, padding: "0 16px", ...style }}>
      {copyright ?? children}
    </AntFooter>
  );
}
