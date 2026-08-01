/**
 * Formats a raw status string (e.g., 'IN_PROGRESS', 'pending_approval') 
 * into a human-readable title-cased string ('In Progress', 'Pending Approval').
 */
export function formatStatus(status: string): string {
  if (!status) return '';
  
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
