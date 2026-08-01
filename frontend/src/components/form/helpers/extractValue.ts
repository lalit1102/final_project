import { normalizeValue } from "./normalizeValue";

export function extractValue<TValue>(value: TValue | undefined): TValue | undefined {
  return normalizeValue(value);
}
