export function callAll<Args extends unknown[]>(
  ...callbacks: Array<((...args: Args) => void) | undefined>
) {
  return (...args: Args) => {
    for (const callback of callbacks) {
      callback?.(...args);
    }
  };
}
