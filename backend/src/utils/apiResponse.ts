export function sendResponse<T>(data: T | null, message = "Success", errors: string[] | null = null) {
  return {
    success: !errors || errors.length === 0,
    message,
    data,
    errors: errors ?? [],
  };
}
