"use client";

import { Card as AntCard, Skeleton } from "antd";
import type { CSSProperties } from "react";
import { DEFAULT_CARD_PADDING, DEFAULT_CARD_VARIANT } from "./constants";
import { getCardContent } from "./helpers";
import { useCardLoading } from "./hooks";
import type { BaseCardProps } from "./types";

export default function Card({
  children,
  title,
  subtitle,
  extra,
  actions,
  loading,
  skeleton,
  skeletonProps,
  variant = DEFAULT_CARD_VARIANT,
  fullWidth,
  responsive,
  style,
  className,
  ...rest
}: BaseCardProps) {
  const { shouldRenderSkeleton } = useCardLoading(loading, skeleton);

  const resolvedStyle: CSSProperties = {
    width: fullWidth ? "100%" : undefined,
    maxWidth: responsive ? "100%" : undefined,
    ...style,
  };

  const headerTitle = subtitle ? (
    <div>
      <div>{title}</div>
      <div style={{ fontSize: 12, color: "#8c8c8c" }}>{subtitle}</div>
    </div>
  ) : (
    title
  );

  if (shouldRenderSkeleton) {
    const { role, content, ...cardRest } = rest as Record<string, unknown>;
    return (
      <AntCard
        {...cardRest}
        className={className}
        style={resolvedStyle}
        title={headerTitle}
        extra={extra}
        variant={variant}
      >
        <Skeleton active {...skeletonProps} />
      </AntCard>
    );
  }

  const { role, content, ...cardRest } = rest as Record<string, unknown>;

  return (
    <AntCard
      {...cardRest}
      className={className}
      style={resolvedStyle}
      title={headerTitle}
      extra={extra}
      variant={variant}
      actions={actions}
    >
      {getCardContent(children, null)}
    </AntCard>
  );
}
