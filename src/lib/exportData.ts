/**
 * Client-side data export helpers (Category 6: Analytics & Creator Tools).
 * Build CSV/JSON in the browser and trigger a download — no backend needed.
 */

/** Escape a value for CSV (quote if it contains comma/quote/newline). */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Convert an array of row-objects into CSV text using the given column order. */
export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.map(csvCell).join(',');
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

/** Trigger a browser download of arbitrary text content. */
export function downloadFile(filename: string, content: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[], columns?: string[]): void {
  downloadFile(filename, toCSV(rows, columns), 'text/csv;charset=utf-8');
}

export function downloadJSON(filename: string, data: unknown): void {
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json');
}
