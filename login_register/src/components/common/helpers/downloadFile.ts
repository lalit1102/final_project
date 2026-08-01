/**
 * Triggers a file download programmatically using a blob URL.
 */
export function downloadFile(data: Blob | string, filename: string): void {
  const url = typeof data === 'string' ? data : window.URL.createObjectURL(data);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof data !== 'string') {
    window.URL.revokeObjectURL(url);
  }
}
