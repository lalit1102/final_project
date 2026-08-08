"use client";

import Link from "next/link";
import { Button as AntButton } from "antd";
import type { CSSProperties } from "react";
import { DEFAULT_BUTTON_SIZE } from "./constants";
import { composeDisabled } from "./helpers";
import { useButtonPermission } from "./hooks";
import type { LinkButtonProps } from "./types";

export default function LinkButton({
  href,
  target,
  children,
  disabled,
  permission,
  size = DEFAULT_BUTTON_SIZE,
  style,
  className,
  ...rest
}: LinkButtonProps) {
  const { disabled: permissionDisabled } = useButtonPermission(permission);

  const resolvedStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    ...style,
  };

  if (!href) {
    return null;
  }

  return (
    <Link href={href} target={target} passHref legacyBehavior>
      <AntButton
        {...rest}
        className={className}
        style={resolvedStyle}
        size={size}
        disabled={composeDisabled(disabled, permissionDisabled)}
        aria-disabled={composeDisabled(disabled, permissionDisabled)}
      >
        {children}
      </AntButton>
    </Link>
  );
}
