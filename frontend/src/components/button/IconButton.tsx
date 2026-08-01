"use client";

import { Button as AntButton } from "antd";
import type { CSSProperties } from "react";
import { DEFAULT_BUTTON_SIZE } from "./constants";
import { composeDisabled } from "./helpers";
import { useButtonPermission } from "./hooks";
import type { IconButtonProps } from "./types";

export default function IconButton({
  icon,
  label,
  disabled,
  permission,
  size = DEFAULT_BUTTON_SIZE,
  style,
  className,
  ...rest
}: IconButtonProps) {
  const { disabled: permissionDisabled } = useButtonPermission(permission);

  const resolvedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  return (
    <AntButton
      {...rest}
      className={className}
      style={resolvedStyle}
      icon={icon}
      size={size}
      disabled={composeDisabled(disabled, permissionDisabled)}
      aria-label={label}
      aria-disabled={composeDisabled(disabled, permissionDisabled)}
    />
  );
}
