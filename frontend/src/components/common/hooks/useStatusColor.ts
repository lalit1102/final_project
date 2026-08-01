'use client';

import { useMemo } from 'react';
import type { StatusType } from '../types';
import { getColorByStatus } from '../helpers/getColorByStatus';

/**
 * Hook to memoize and fetch status colors based on the design system.
 */
export function useStatusColor(status: StatusType, customColor?: string) {
  return useMemo(() => {
    if (customColor) return customColor;
    return getColorByStatus(status);
  }, [status, customColor]);
}
