"use client";

import styles from "./Logo.module.css";

export default function LogoIcon() {
  return (
    <div className={styles.iconWrapper}>
      <svg
        className={styles.icon}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="learnsphere-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1677FF" />
            <stop offset="100%" stopColor="#69B1FF" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="url(#learnsphere-gradient)"
        />

        {/* Book */}
        <path
          d="M18 25C18 22 20 20 23 20H32V44H23C20 44 18 42 18 39V25Z"
          fill="#fff"
        />

        <path
          d="M46 25C46 22 44 20 41 20H32V44H41C44 44 46 42 46 39V25Z"
          fill="#EAF4FF"
        />

        {/* Graduation Cap */}
        <path
          d="M16 18L32 11L48 18L32 25L16 18Z"
          fill="#FFC53D"
        />

        <path
          d="M22 22V29C22 32 26 34 32 34C38 34 42 32 42 29V22"
          fill="#FFD666"
        />
      </svg>
    </div>
  );
}