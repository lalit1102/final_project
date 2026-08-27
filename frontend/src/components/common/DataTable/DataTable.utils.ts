import type { ColumnsType } from 'antd/es/table';

export type { ColumnsType };

/**
 * Default row key getter: reads the `key` or `id` property from a record.
 * Falls back to the row index if neither exists.
 *
 * Generic and domain-agnostic. Consumers may pass their own `rowKey` prop
 * to override this behavior.
 */
export function defaultRowKey<T>(record: T, index: number): string | number {
  if (typeof record === 'object' && record !== null) {
    const r = record as Record<string, unknown>;
    if (typeof r.key === 'string' || typeof r.key === 'number') return r.key as string | number;
    if (typeof r.id === 'string' || typeof r.id === 'number') return r.id as string | number;
  }
  return index;
}
