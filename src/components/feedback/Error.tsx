"use client";

import { Result } from "antd";
import type { ErrorProps } from "./types";
import { DEFAULT_FEEDBACK_DESCRIPTION, DEFAULT_FEEDBACK_TITLE } from "./constants";

export default function Error({ title = DEFAULT_FEEDBACK_TITLE, description = DEFAULT_FEEDBACK_DESCRIPTION, retry, children, ...rest }: ErrorProps) {
  return (
    <div {...rest}>
      <Result status="error" title={title} subTitle={description} extra={retry} />
      {children}
    </div>
  );
}
