"use client";

import { Spin } from "antd";
import type { LoaderProps } from "./types";
import { DEFAULT_FEEDBACK_SIZE } from "./constants";

export default function Loader({ text, size = DEFAULT_FEEDBACK_SIZE, children, ...rest }: LoaderProps) {
  return (
    <div {...rest}>
      <Spin size={size} tip={text} />
      {children}
    </div>
  );
}
