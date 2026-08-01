"use client";

import { useCallback } from "react";
import { createModalPromise } from "../helpers";

export function useModalPromise() {
  return useCallback((options: Parameters<typeof createModalPromise>[0]) => createModalPromise(options), []);
}
