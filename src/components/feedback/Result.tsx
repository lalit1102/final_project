"use client";

import { Result as AntResult } from "antd";
import type { ResultProps } from "./types";

export default function Result({ title, description, extra, status = "info", children, ...rest }: ResultProps) {
  return (
    <div {...rest}>
      <AntResult status={status} title={title} subTitle={description} extra={extra} />
      {children}
    </div>
  );
}
