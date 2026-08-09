import { Grid } from 'antd';

export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export type BreakpointKey = keyof typeof breakpoints;

export function useBreakpoint(): Partial<Record<BreakpointKey, boolean>> {
  const grid = Grid.useBreakpoint();
  return grid;
}
