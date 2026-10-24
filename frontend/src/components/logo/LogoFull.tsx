"use client";

import LogoIcon from "./LogoIcon";
import styles from "./Logo.module.css";

interface LogoFullProps {
  showTagline?: boolean;
}

export default function LogoFull({
  showTagline = false,
}: LogoFullProps) {
  return (
    <div className={styles.fullLogo}>
      <LogoIcon />

      <div className={styles.brand}>
        <h1 className={styles.title}>
          LearnSphere
        </h1>

        {showTagline && (
          <p className={styles.tagline}>
            Learn • Manage • Succeed
          </p>
        )}
      </div>
    </div>
  );
}