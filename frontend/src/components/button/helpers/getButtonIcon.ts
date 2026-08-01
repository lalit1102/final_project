import type { ReactNode } from "react";
import type { ButtonIconPosition } from "../types";

export function getButtonIcon(icon: ReactNode | undefined, iconPosition: ButtonIconPosition | undefined) {
  return iconPosition === "end" ? undefined : icon;
}
