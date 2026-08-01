/**
 * Opens a URL in a new tab securely to prevent reverse tabnabbing.
 */
export function openInNewTab(url: string): void {
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.opener = null;
  }
}
