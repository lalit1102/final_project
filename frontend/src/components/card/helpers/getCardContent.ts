import type { ReactNode } from "react";

export function getCardContent(children: ReactNode | undefined, fallback: ReactNode) {
  return children ?? fallback;
}
