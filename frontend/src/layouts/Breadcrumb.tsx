"use client";

import { Breadcrumb as AntBreadcrumb } from "antd";
import type { BreadcrumbProps } from "./types";

export default function Breadcrumb({ items = [], className, style }: BreadcrumbProps) {
  return (
    <div className={className} style={style}>
      <AntBreadcrumb items={items.map((item) => ({ title: item.title, href: item.href }))} />
    </div>
  );
}
