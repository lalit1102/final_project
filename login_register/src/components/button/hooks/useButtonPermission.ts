"use client";

import { useMemo } from "react";

export function useButtonPermission(permission?: string | string[]) {
  return useMemo(() => {
    if (!permission) {
      return { allowed: true, disabled: false };
    }

    const permissions = Array.isArray(permission) ? permission : [permission];

    return {
      allowed: permissions.length > 0,
      disabled: permissions.length === 0,
    };
  }, [permission]);
}
