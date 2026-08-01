"use client";

import { Button as AntButton } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_BUTTON_HTML_TYPE, DEFAULT_BUTTON_ICON_POSITION, DEFAULT_BUTTON_SIZE, DEFAULT_BUTTON_TYPE, DEFAULT_BUTTON_VARIANT, DEFAULT_LOADING_TEXT } from "./constants";
import { composeDisabled, getButtonIcon } from "./helpers";
import { useButtonLoading, useButtonPermission } from "./hooks";
import type { BaseButtonProps } from "./types";

export default function Button({
  children,
  icon,
  iconPosition = DEFAULT_BUTTON_ICON_POSITION,
  loading,
  loadingText = DEFAULT_LOADING_TEXT,
  spinner,
  disabled,
  fullWidth,
  responsiveWidth,
  permission,
  onAnalytics,
  tooltip,
  variant = DEFAULT_BUTTON_VARIANT,
  htmlType = DEFAULT_BUTTON_HTML_TYPE,
  type = DEFAULT_BUTTON_TYPE,
  size = DEFAULT_BUTTON_SIZE,
  style,
  className,
  ...rest
}: BaseButtonProps) {
  const { loading: isLoading, loadingText: resolvedLoadingText } = useButtonLoading(loading, loadingText);
  const { disabled: permissionDisabled } = useButtonPermission(permission);

  const resolvedStyle: CSSProperties = {
    width: fullWidth || responsiveWidth ? "100%" : undefined,
    ...style,
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onAnalytics?.("click");
    rest.onClick?.(event);
  };

  return (
    <AntButton
      {...rest}
      className={className}
      style={resolvedStyle}
      size={size}
      type={type}
      htmlType={htmlType}
      icon={getButtonIcon(icon, iconPosition)}
      loading={isLoading}
      disabled={composeDisabled(disabled, permissionDisabled)}
      onClick={handleClick}
      title={typeof tooltip === "string" ? tooltip : undefined}
      data-variant={variant}
      aria-disabled={composeDisabled(disabled, permissionDisabled)}
    >
      {isLoading ? resolvedLoadingText : children}
      {spinner}
    </AntButton>
  );
}
