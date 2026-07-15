"use client";

import { Skeleton as AntSkeleton } from "antd";
import type { SkeletonProps } from "./types";

export default function Skeleton({ active = true, paragraph = true, title = true, avatar = false, children, ...rest }: SkeletonProps) {
  return (
    <div {...rest}>
      <AntSkeleton active={active} paragraph={paragraph} title={title} avatar={avatar} />
      {children}
    </div>
  );
}
