import type { StatusType } from '../types';

/**
 * Maps a logical status to an enterprise design system color token.
 * Uses Ant Design predefined preset colors where appropriate.
 */
export function getColorByStatus(status: StatusType): string {
  switch (status) {
    case 'success':
      return 'success'; // maps to antd preset or css var
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
      return 'processing';
    case 'pending':
      return 'default';
    default:
      return 'default';
  }
}
