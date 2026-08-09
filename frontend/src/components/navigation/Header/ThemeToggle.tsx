'use client';

import React, { useEffect } from 'react';
import { Button } from 'antd';
import { BulbOutlined, BulbFilled, MonitorOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/storeHooks';
import { setThemeMode } from '@/store/slices';
import type { ThemeMode } from '@/store/slices/uiSlice';

const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'light', label: 'Light', icon: <BulbOutlined /> },
  { mode: 'dark', label: 'Dark', icon: <BulbFilled /> },
  { mode: 'system', label: 'System', icon: <MonitorOutlined /> },
];

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector((state) => state.ui.themeMode);

  const handleToggle = () => {
    const currentIndex = themeOptions.findIndex((opt) => opt.mode === currentMode);
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    const nextMode = themeOptions[nextIndex]?.mode ?? 'light';
    dispatch(setThemeMode(nextMode));
  };

  const currentOption = themeOptions.find((opt) => opt.mode === currentMode) ?? themeOptions[0]!;

  useEffect(() => {
    try {
      localStorage.setItem("themeMode", currentMode);
    } catch {
      /* localStorage may be unavailable in restricted environments */
    }
  }, [currentMode]);

  return (
    <Button
      type="text"
      size="small"
      icon={currentOption.icon}
      title={`Theme: ${currentOption.label}. Click to cycle.`}
      onClick={handleToggle}
      aria-label={`Current theme: ${currentOption.label}. Click to cycle themes.`}
    >
      {currentOption.label}
    </Button>
  );
};

export default ThemeToggle;
