// Small utility helpers used across the app.

/** Conditionally join class names, filtering out falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Format a number as currency (USD-style, configurable). */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format a compact number, e.g. 1_200 -> 1.2K */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}

/** Format an ISO date string to a readable date. */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(date);
}

/** Return today's date as yyyy-mm-dd. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Return an ISO date offset by a number of days from today. */
export function isoOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Simple percentage with clamping. */
export function percentage(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/** Generate a pseudo-unique id. */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Get initials from a full name. */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Returns whether two date ranges overlap (inclusive). */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Inclusive day count between two ISO dates. */
export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

/** Convert an array of objects to a CSV string. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const escape = (val: unknown) => {
    const s = String(val ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(String(c))).join(',');
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

/** Trigger a browser download of a text file. */
export function downloadFile(filename: string, content: string, mime = 'text/csv'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Sleep helper for simulated latency. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Client-side pagination helper. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
