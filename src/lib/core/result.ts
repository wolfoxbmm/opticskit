/**
 * OpticsKit — Unified Result Schema & Status System
 *
 * Every tool's output MUST route through these helpers.
 * This is NOT a physics layer — it's a DISPLAY CONTRACT.
 *
 * Rules:
 *   "valid"       — standard model / authoritative source
 *   "approximate" — engineering simplification / empirical formula / numerical approximation
 *   "invalid"     — NaN / null / undefined / division by zero
 *   "out_of_range" — Infinity / value exceeds physical bounds
 */

import { formatValue, isValidNumber, type ModelStatus } from '@/lib/utils/number';

// ─── Status types ────────────────────────────────────────────────────────────

export type ResultStatus = 'valid' | 'approximate' | 'invalid' | 'out_of_range';

export interface ResultDescriptor {
  value: number | null;
  display: string;
  status: ResultStatus;
  label?: string;
  unit?: string;
  /** Whether this particular field is based on an approximate model (not the tool as a whole). */
  modelStatus?: ModelStatus;
}

// ─── Status detection ────────────────────────────────────────────────────────

/**
 * Detect the result status for a single numeric value.
 * Does NOT modify the value — only classifies it.
 */
export function getResultStatus(
  v: number | null | undefined,
  override?: 'approximate' | 'valid',
): ResultStatus {
  if (v == null || (typeof v === 'number' && isNaN(v))) return 'invalid';
  if (!isValidNumber(v)) return 'out_of_range';
  if (override === 'approximate') return 'approximate';
  if (override === 'valid') return 'valid';
  return 'valid';
}

// ─── Core wrapper ────────────────────────────────────────────────────────────

export interface FormatResultOptions {
  precision?: number;
  unit?: string;
  label?: string;
  /** Force status override (e.g. for known approximate models). */
  statusOverride?: 'approximate' | 'valid';
  /** Custom fallback display string. */
  fallback?: string;
  /** If true and status is invalid/out_of_range, use explicit labels instead of "—". */
  explicitError?: boolean;
}

/**
 * Wrap a raw numeric value into a unified ResultDescriptor.
 * This is the SINGLE entry point all tools should use.
 *
 * Usage:
 *   const r = formatResult(cct, { precision: 0, unit: " K", statusOverride: "approximate" });
 *   // r.display → "6500 K"  or  "—"  or  "out of range"
 */
export function formatResult(
  v: number | null | undefined,
  opts: FormatResultOptions = {},
): ResultDescriptor {
  const { precision = 2, unit, label, statusOverride, fallback, explicitError } = opts;

  const rawStatus = getResultStatus(v, statusOverride);
  let display: string;

  if (rawStatus === 'invalid') {
    display = explicitError ? 'invalid input' : (fallback ?? '—');
  } else if (rawStatus === 'out_of_range') {
    display = explicitError ? 'out of range' : (fallback ?? '—');
  } else {
    display = formatValue(v as number, { precision, unit, fallback });
  }

  return {
    value: isValidNumber(v) ? (v as number) : null,
    display,
    status: rawStatus,
    label,
    unit,
    modelStatus: (statusOverride === 'approximate' || statusOverride === 'valid')
      ? (statusOverride === 'approximate' ? 'approximate' : 'standard') : undefined,
  };
}

// ─── Tool-level model status (for badge rendering) ───────────────────────────

export interface ToolModelMeta {
  /** Primary model status for the entire tool. */
  primary: ModelStatus;
  /** Secondary statuses for specific sub-computations (e.g. CIE76 inside chromaticity). */
  sub?: { label: string; status: ModelStatus }[];
  /** Human-readable model description. */
  description: string;
}

/**
 * Pre-defined tool model metadata. All tools MUST use this map
 * instead of hardcoding badge text.
 */
export const TOOL_MODEL_META: Record<string, ToolModelMeta> = {
  chromaticity: {
    primary: 'approximate',
    description: 'CIE 1931 2° · CIE 15:2018',
    sub: [
      { label: 'XYZ / xy', status: 'standard' },
      { label: 'CCT (Robertson 1968)', status: 'approximate' },
      { label: 'ΔE (CIE76)', status: 'approximate' },
      { label: '波长→颜色映射', status: 'approximate' },
    ],
  },

  diffraction: {
    primary: 'approximate',
    description: 'Fraunhofer 远场 · 标量衍射',
  },
  'gaussian-beam': {
    primary: 'approximate',
    description: 'Kogelnik 近轴理论 · TEM₀₀ · M² 等效波长',
  },
  'light-source': {
    primary: 'approximate',
    description: 'CIE 15:2018 + Robertson 1968',
    sub: [
      { label: 'XYZ / xy / CCT', status: 'standard' },
      { label: 'CRI (Δu\'v\' 近似)', status: 'approximate' },
    ],
  },
  spectrum: {
    primary: 'standard',
    description: 'CIE 1931 2° · 标准三刺激值积分',
  },
  'camera-lens': {
    primary: 'approximate',
    description: '高斯光学几何公式 · 无畸变/衍射修正',
  },
  laser: {
    primary: 'standard',
    description: '公开激光参数数据汇编',
  },
  'thin-film': {
    primary: 'standard',
    description: 'TMM 传输矩阵法 · Macleod 标准公式',
  },
  'material-db': {
    primary: 'standard',
    description: 'refractiveindex.info · CC0 1.0',
  },
};

// ─── Unified badge helper ────────────────────────────────────────────────────

import { BADGE_STYLES } from '@/lib/utils/number';

/**
 * Build a unified badge descriptor from tool metadata.
 * Returns arrays of { label, styleClass } for rendering.
 */
export function getToolBadges(toolKey: string): { label: string; styleClass: string }[] {
  const meta = TOOL_MODEL_META[toolKey];
  if (!meta) return [];
  const badges: { label: string; styleClass: string }[] = [];
  badges.push({
    label: meta.primary === 'standard' ? 'Standard Model' : 'Approximate Model',
    styleClass: BADGE_STYLES[meta.primary],
  });
  if (meta.sub) {
    for (const sub of meta.sub) {
      badges.push({
        label: `${sub.status === 'standard' ? '✓' : '⚠'} ${sub.label}`,
        styleClass: BADGE_STYLES[sub.status],
      });
    }
  }
  return badges;
}
