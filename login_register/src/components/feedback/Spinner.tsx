"use client";

import { Spin } from "antd";
import type { SpinnerProps } from "./types";
import { DEFAULT_FEEDBACK_SIZE } from "./constants";

export default function Spinner({ text, size = DEFAULT_FEEDBACK_SIZE, children, ...rest }: SpinnerProps) {
  return (
    <div {...rest}>
      <Spin size={size} tip={text} />
      {children}
    </div>
  );
}
