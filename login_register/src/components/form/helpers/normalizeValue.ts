export function normalizeValue<TValue>(value: TValue | null | undefined): TValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return value;
}
