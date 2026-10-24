"use client";

import LogoFull from "./LogoFull";
import LogoIcon from "./LogoIcon";

interface LogoProps {
  collapsed?: boolean;
  showTagline?: boolean;
}

export default function Logo({
  collapsed = false,
  showTagline = false,
}: LogoProps) {
  if (collapsed) {
    return <LogoIcon />;
  }

  return <LogoFull showTagline={showTagline} />;
}