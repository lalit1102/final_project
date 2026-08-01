"use client";

import { Empty as AntEmpty } from "antd";
import type { EmptyProps } from "./types";
import { DEFAULT_FEEDBACK_DESCRIPTION, DEFAULT_FEEDBACK_TITLE } from "./constants";

export default function Empty({ title = DEFAULT_FEEDBACK_TITLE, description = DEFAULT_FEEDBACK_DESCRIPTION, action, children, ...rest }: EmptyProps) {
  return (
    <div {...rest}>
      <AntEmpty description={description} image={AntEmpty.PRESENTED_IMAGE_SIMPLE} />
      {title ? <div style={{ fontWeight: 600, marginTop: 8 }}>{title}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
      {children}
    </div>
  );
}
