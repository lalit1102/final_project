"use client";

import { useMemo } from "react";
import { composeLoading } from "../helpers";

export function useButtonLoading(loading: boolean | undefined, loadingText: React.ReactNode | undefined) {
  return useMemo(() => ({
    loading,
    loadingText: composeLoading(loading, loadingText),
  }), [loading, loadingText]);
}
