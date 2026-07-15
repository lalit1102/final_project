"use client";

import { useMemo } from "react";

export function useLayoutResponsive(isMobile: boolean | undefined) {
  return useMemo(() => ({
    isMobile: Boolean(isMobile),
  }), [isMobile]);
}
