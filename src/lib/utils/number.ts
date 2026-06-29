/**
 * OpticsKit — Unified Number Safety & Display Rules
 *
 * All tools MUST route value display through these helpers.
 * Direct toFixed() on raw computation results is forbidden.
 *
 * Rules:
 *   NaN / undefined / null / Infinity → "—"
 *   Finite valid number → formatted with unit
 *   Out-of-range marker → "out of range"
 */

// ─── Guards ──────────────────────────────────────────────────────────────────

/** Returns true if v is a finite number (not NaN, not ±Infinity). */
export function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export interface FormatOptions {
  /** Digits after decimal (default 2). */
  precision?: number;
  /** Unit string appended after value (e.g. " mm", " K"). */
  unit?: string;
  /** If true and v is out-of-range, return "out of range" instead of "—". */
  outOfRangeLabel?: boolean;
  /** Custom fallback string (default "—"). */
  fallback?: string;
}

/**
 * Safe value formatter.
 *
 * - NaN / undefined / null / Infinity → fallback (default "—")
 * - Finite number → rounded to precision + optional unit
 *
 * Usage:
 *   formatValue(cct, { precision: 0, unit: " K" })        // "6500 K"
 *   formatValue(Infinity, { unit: " K" })                 // "—"
 *   formatValue(null, { outOfRangeLabel: true })          // "out of range"
 */
export function formatValue(
  v: number | null | undefined,
  opts: FormatOptions = {},
): string {
  const { precision = 2, unit = '', outOfRangeLabel = false, fallback } = opts;

  if (!isValidNumber(v)) {
    if (outOfRangeLabel) return 'out of range';
    return fallback ?? '—';
  }

  // SAFE: v is confirmed finite-number here by isValidNumber guard
  const num = v as number;
  const fixed = num.toFixed(precision);
  return `${fixed}${unit}`;
}

// ─── Status badges ───────────────────────────────────────────────────────────

export type ModelStatus = 'standard' | 'approximate' | 'invalid';

export interface StatusBadge {
  status: ModelStatus;
  label: string;       // short label, e.g. "Standard Model"
  detail: string;      // longer explanation for tooltip
}

const STATUS_DEFS: Record<ModelStatus, { prefix: string; cssClass: string }> = {
  standard:     { prefix: '✓', cssClass: 'badge-standard' },
  approximate:  { prefix: '⚠', cssClass: 'badge-approximate' },
  invalid:      { prefix: '✗', cssClass: 'badge-invalid' },
};

/**
 * Return a status badge descriptor for a given model status.
 */
export function getStatusBadge(status: ModelStatus, label: string, detail?: string): StatusBadge {
  return { status, label, detail: detail ?? label };
}

/**
 * Render a status badge as a plain-text string.
 * In React components, prefer using the returned data to render custom JSX.
 */
export function formatBadgeText(badge: StatusBadge): string {
  const def = STATUS_DEFS[badge.status];
  return `${def.prefix} ${badge.label}`;
}

// Tailwind-compatible CSS class suggestions (for copy-paste into React components):
//
// .badge-standard    → bg-green-100 text-green-700 border border-green-200 rounded px-2 py-0.5 text-xs
// .badge-approximate → bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-0.5 text-xs
// .badge-invalid     → bg-red-100 text-red-700 border border-red-200 rounded px-2 py-0.5 text-xs

export const BADGE_STYLES: Record<ModelStatus, string> = {
  standard:    'bg-green-100 text-green-700 border border-green-200 rounded px-2 py-0.5 text-xs font-medium',
  approximate: 'bg-amber-100 text-amber-700 border border-amber-200 rounded px-2 py-0.5 text-xs font-medium',
  invalid:     'bg-red-100 text-red-700 border border-red-200 rounded px-2 py-0.5 text-xs font-medium',
};
