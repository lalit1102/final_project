import { DEFAULT_MAX_TEXT_LENGTH } from '../constants';

/**
 * Truncates text to a specified maximum length, appending an ellipsis.
 */
export function truncateText(text: string, maxLength: number = DEFAULT_MAX_TEXT_LENGTH): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}
