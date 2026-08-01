"use client";

import { useMemo } from "react";

export function useCardLoading(loading: boolean | undefined, skeleton: boolean | undefined) {
  return useMemo(() => ({
    shouldRenderSkeleton: Boolean(skeleton || loading),
  }), [loading, skeleton]);
}
