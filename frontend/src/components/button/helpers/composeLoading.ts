export function composeLoading(loading: boolean | undefined, loadingText: React.ReactNode | undefined) {
  if (!loading) {
    return undefined;
  }

  return loadingText;
}
