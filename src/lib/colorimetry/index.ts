/**
 * OpticsKit Colorimetry Engine
 * 
 * CIE 1931 Standard Colorimetric System — core computation functions.
 * Reference: CIE 15:2018, ISO/CIE 11664 series.
 */

import { CIE_X_BAR, CIE_Y_BAR, CIE_Z_BAR, CIE_WAVELENGTHS } from './cmf-generated';

// ─── Constants ────────────────────────────────────────────────────────────────
const CIE_K = 683.002; // lm/W — maximum luminous efficacy for photopic vision

/** Planck constant (J·s) */
const H = 6.62607015e-34;
/** Speed of light in vacuum (m/s) */
const C = 299792458;
/** Boltzmann constant (J/K) */
const K_B = 1.380649e-23;
/** First radiation constant c₁ = 2πhc² (W·m²) */
const C1 = 2.0 * Math.PI * H * C * C;
/** Second radiation constant c₂ = hc/k (m·K) */
const C2 = (H * C) / K_B;

// ─── Linear interpolation helper ──────────────────────────────────────────────
function lerp(
  lambda: number,
  wavelengths: Float64Array,
  values: Float64Array
): number {
  if (lambda <= wavelengths[0]) return values[0];
  if (lambda >= wavelengths[wavelengths.length - 1])
    return values[wavelengths.length - 1];

  // Binary search
  let lo = 0;
  let hi = wavelengths.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (wavelengths[mid] <= lambda) lo = mid;
    else hi = mid;
  }
  const t = (lambda - wavelengths[lo]) / (wavelengths[hi] - wavelengths[lo]);
  return values[lo] + t * (values[hi] - values[lo]);
}

function getCMF(lambda: number): [number, number, number] {
  return [
    lerp(lambda, CIE_WAVELENGTHS, CIE_X_BAR),
    lerp(lambda, CIE_WAVELENGTHS, CIE_Y_BAR),
    lerp(lambda, CIE_WAVELENGTHS, CIE_Z_BAR),
  ];
}

// ─── 1. SPD → XYZ ────────────────────────────────────────────────────────────

/**
 * Compute CIE 1931 XYZ tristimulus values from a spectral power distribution.
 * Uses trapezoidal integration (suitable for 1-nm data).
 *
 * @param spd - Spectral power distribution values (arbitrary units).
 * @param wavelengths - Corresponding wavelengths in nm (monotonically increasing).
 * @returns {X, Y, Z} — absolute tristimulus values. Normalize as needed.
 */
export function spectrumToXYZ(
  spd: number[],
  wavelengths: number[]
): { X: number; Y: number; Z: number } {
  if (spd.length !== wavelengths.length) {
    throw new Error(
      `spd length (${spd.length}) must match wavelengths length (${wavelengths.length})`
    );
  }

  let X = 0;
  let Y = 0;
  let Z = 0;

  const n = wavelengths.length;

  for (let i = 1; i < n; i++) {
    const dLambda = wavelengths[i] - wavelengths[i - 1];
    const [x1, y1, z1] = getCMF(wavelengths[i - 1]);
    const [x2, y2, z2] = getCMF(wavelengths[i]);

    const avgSpd = (spd[i - 1] + spd[i]) * 0.5;

    X += avgSpd * (x1 + x2) * 0.5 * dLambda;
    Y += avgSpd * (y1 + y2) * 0.5 * dLambda;
    Z += avgSpd * (z1 + z2) * 0.5 * dLambda;
  }

  return { X, Y, Z };
}

// ─── 2. XYZ → Chromaticity ────────────────────────────────────────────────────

/**
 * Convert CIE XYZ tristimulus values to CIE 1931 chromaticity coordinates (x, y).
 */
export function xyzToChromaticity(XYZ: {
  X: number;
  Y: number;
  Z: number;
}): { x: number; y: number } {
  const { X, Y, Z } = XYZ;
  const denom = X + Y + Z;
  if (denom === 0) return { x: 0, y: 0 };
  return { x: X / denom, y: Y / denom };
}

// ─── 3. CIE 1976 UCS (u', v') ────────────────────────────────────────────────

/**
 * Convert CIE 1931 (x, y) chromaticity to CIE 1976 UCS (u', v') coordinates.
 */
export function xyToUvPrime(
  x: number,
  y: number
): { uPrime: number; vPrime: number } {
  const denom = -2 * x + 12 * y + 3;
  if (denom === 0) return { uPrime: 0, vPrime: 0 };
  return {
    uPrime: (4 * x) / denom,
    vPrime: (9 * y) / denom,
  };
}

/**
 * Convert CIE 1976 (u', v') to CIE 1960 UCS (u, v).
 * u = u', v = (2/3) * v'
 */
export function uvPrimeToUv(uPrime: number, vPrime: number): { u: number; v: number } {
  return { u: uPrime, v: (2 / 3) * vPrime };
}

// ─── 4. Correlated Color Temperature (Robertson 1968) ────────────────────────

/**
 * Pre-computed isotemperature line data from Robertson (1968),
 * J. Opt. Soc. Am. 58, 1528-1535.
 *
 * The table uses CIE 1960 UCS (u, v) coordinates.
 * Each entry: [1e6/T, u_i, v_i, slope m_i]
 * where m_i = -sin(θᵢ) / cos(θᵢ) for the i-th isotemperature line.
 */
const ROBERTSON_TABLE: [number, number, number, number][] = [
  [0, 0.18006, 0.26352, -0.24341],
  [10, 0.18066, 0.26589, -0.25479],
  [20, 0.18133, 0.26846, -0.26876],
  [30, 0.18208, 0.27119, -0.28539],
  [40, 0.18293, 0.27407, -0.30470],
  [50, 0.18388, 0.27709, -0.32675],
  [60, 0.18494, 0.28021, -0.35156],
  [70, 0.18611, 0.28342, -0.37915],
  [80, 0.18740, 0.28668, -0.40955],
  [90, 0.18880, 0.28997, -0.44278],
  [100, 0.19032, 0.29326, -0.47888],
  [125, 0.19462, 0.30141, -0.58204],
  [150, 0.19962, 0.30921, -0.70471],
  [175, 0.20525, 0.31647, -0.84901],
  [200, 0.21142, 0.32312, -1.01820],
  [225, 0.21807, 0.32909, -1.21680],
  [250, 0.22511, 0.33439, -1.45120],
  [275, 0.23247, 0.33904, -1.73060],
  [300, 0.24010, 0.34308, -2.06730],
  [325, 0.24792, 0.34655, -2.47640],
  [350, 0.25591, 0.34951, -2.97730],
  [375, 0.26400, 0.35200, -3.59280],
  [400, 0.27218, 0.35407, -4.35440],
  [425, 0.28039, 0.35577, -5.30380],
  [450, 0.28863, 0.35714, -6.49610],
  [475, 0.29685, 0.35823, -8.00560],
  [500, 0.30505, 0.35907, -9.93400],
  [525, 0.31320, 0.35968, -12.42000],
  [550, 0.32129, 0.36011, -15.65400],
  [575, 0.32931, 0.36038, -19.90800],
  [600, 0.33724, 0.36051, -25.59000],
];

/**
 * Compute Correlated Color Temperature (CCT) from CIE 1976 UCS (u', v')
 * using Robertson's 1968 method.
 *
 * @param uvPrime - { uPrime, vPrime } in CIE 1976 UCS.
 * @returns CCT in Kelvin, or Infinity if out of range.
 */
export function cctRobertson(uvPrime: {
  uPrime: number;
  vPrime: number;
}): number {
  return cctWithDuv(uvPrime).cct;
}

/** Extended CCT calculation with Duv output.
 * Accepts CIE 1976 UCS (u', v') internally converts to CIE 1960 UCS (u, v)
 * for the Robertson 1968 table lookup. */
export function cctWithDuv(uvPrime: {
  uPrime: number;
  vPrime: number;
}): { cct: number; duv: number } {
  // Convert u'v' (CIE 1976) → uv (CIE 1960) for Robertson table
  const { u, v: vs } = uvPrimeToUv(uvPrime.uPrime, uvPrime.vPrime);
  const us = u;
  const n = ROBERTSON_TABLE.length;
  let bestDi = 0;
  let bestDj = 0;

  for (let i = 0; i < n - 1; i++) {
    const [t1, u1, v1, m1] = ROBERTSON_TABLE[i];
    const [t2, u2, v2, m2] = ROBERTSON_TABLE[i + 1];

    const di = ((vs - v1) - m1 * (us - u1)) / Math.sqrt(1 + m1 * m1);
    const dj = ((vs - v2) - m2 * (us - u2)) / Math.sqrt(1 + m2 * m2);

    if ((di >= 0 && dj < 0) || (di < 0 && dj >= 0)) {
      const f = di / (di - dj);
      const rt = t1 + f * (t2 - t1);
      bestDi = di;
      bestDj = dj;
      return {
        cct: rt === 0 ? Infinity : 1e6 / rt,
        // Duv = signed distance from blackbody locus in CIE 1960 UCS (u,v)
        duv: di,
      };
    }
  }

  // Edge cases — extrapolate
  const [tFirst] = ROBERTSON_TABLE[0];
  const [tLast] = ROBERTSON_TABLE[n - 1];
  const [_, u0, v0, m0] = ROBERTSON_TABLE[0];
  const d0 = ((vs - v0) - m0 * (us - u0)) / Math.sqrt(1 + m0 * m0);

  if (d0 < 0) {
    return { cct: tFirst === 0 ? Infinity : 1e6 / tFirst, duv: d0 };
  }
  return { cct: tLast === 0 ? Infinity : 1e6 / tLast, duv: d0 };
}

// ─── 5. Planckian Blackbody Spectrum ──────────────────────────────────────────

/**
 * Compute the spectral radiance of a Planckian (blackbody) radiator.
 *
 * L_{e,λ}(λ, T) = c₁ / (λ⁵ · (exp(c₂/(λ·T)) - 1))
 *
 * @param T - Temperature in Kelvin.
 * @param wavelengths - Wavelengths in nanometers.
 * @returns SPD array in W·m⁻³ relative units (same length as wavelengths).
 */
export function planckSpectrum(
  T: number,
  wavelengths: number[]
): number[] {
  return wavelengths.map((lambda) => {
    // λ in meters
    const lm = lambda * 1e-9;
    const exponent = C2 / (lm * T);
    // Guard against overflow
    if (exponent > 700) return 0;
    return C1 / (lm ** 5 * (Math.exp(exponent) - 1));
  });
}

// ─── 6. XYZ → Linear sRGB ─────────────────────────────────────────────────────

/**
 * XYZ-to-linear-sRGB conversion matrix (CIE 1931 2° observer, D65 white point).
 * Source: IEC 61966-2-1.
 */
const XYZ_TO_SRGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
];

/**
 * Convert CIE XYZ (D65) to linear sRGB [0, 1] range.
 *
 * Values may fall outside [0, 1]; use clipSRGB() for display-ready output.
 */
export function xyzToSRGB(XYZ: {
  X: number;
  Y: number;
  Z: number;
}): { r: number; g: number; b: number } {
  const { X, Y, Z } = XYZ;
  // Assume XYZ are already normalized so that Y=1 for reference white
  const Yn = XYZ.Y; // reference
  // If unnormalized, use raw values directly for linear transform
  const r = XYZ_TO_SRGB[0][0] * X + XYZ_TO_SRGB[0][1] * Y + XYZ_TO_SRGB[0][2] * Z;
  const g = XYZ_TO_SRGB[1][0] * X + XYZ_TO_SRGB[1][1] * Y + XYZ_TO_SRGB[1][2] * Z;
  const b = XYZ_TO_SRGB[2][0] * X + XYZ_TO_SRGB[2][1] * Y + XYZ_TO_SRGB[2][2] * Z;

  return { r, g, b };
}

// ─── 7. Clip to display range ─────────────────────────────────────────────────

/**
 * Gamma-encode and clip linear sRGB values to [0, 255] range.
 * Returns integer RGB suitable for 8-bit display.
 */
export function clipSRGB(
  r: number,
  g: number,
  b: number
): { r: number; g: number; b: number } {
  const clamp = (v: number) =>
    Math.max(0, Math.min(255, Math.round(gammaCorrect(v) * 255)));
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
}

// ─── 8. XYZ → Display P3 ──────────────────────────────────────────────────────

/**
 * XYZ-to-Display-P3 conversion matrix (D65 white point).
 * Source: SMPTE RP 431-2 / IEC 61966-2-7.
 */
const XYZ_TO_P3 = [
  [2.493496911941425, -0.9313836179191239, -0.40271078445071684],
  [-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
  [0.03584583024378447, -0.07617238926804182, 0.9568845240076872],
];

/**
 * Convert CIE XYZ (D65) to linear Display-P3 [0, 1] range.
 * Apply gammaCorrect() to get display-ready values (P3 uses sRGB gamma).
 */
export function xyzToDisplayP3(XYZ: {
  X: number;
  Y: number;
  Z: number;
}): { r: number; g: number; b: number } {
  const { X, Y, Z } = XYZ;
  const r = XYZ_TO_P3[0][0] * X + XYZ_TO_P3[0][1] * Y + XYZ_TO_P3[0][2] * Z;
  const g = XYZ_TO_P3[1][0] * X + XYZ_TO_P3[1][1] * Y + XYZ_TO_P3[1][2] * Z;
  const b = XYZ_TO_P3[2][0] * X + XYZ_TO_P3[2][1] * Y + XYZ_TO_P3[2][2] * Z;
  return { r, g, b };
}

// ─── 9. sRGB Gamma ────────────────────────────────────────────────────────────

/** sRGB forward gamma correction (linear → sRGB). IEC 61966-2-1. */
export function gammaCorrect(value: number): number {
  if (value <= 0.0031308) return value * 12.92;
  return 1.055 * Math.pow(value, 1.0 / 2.4) - 0.055;
}

/** sRGB inverse gamma correction (sRGB → linear). IEC 61966-2-1. */
export function gammaDecode(value: number): number {
  if (value <= 0.04045) return value / 12.92;
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

// ─── 11. Wavelength to Color ─────────────────────────────────────────────────

/** sRGB color type */
export interface sRGB {
  r: number;
  g: number;
  b: number;
  isValid: boolean;
}

/**
 * Approximate visible-spectrum colour from wavelength.
 * Based on the mapping by Dan Bruton (1996).
 *
 * NOTE — this is an *approximation* for visualisation of spectral locus curves.
 * It does NOT go through CIE XYZ→sRGB — use xyzToSRGB for physically correct colour.
 */
export function wavelengthToColor(wavelength: number): sRGB {
  let r: number, g: number, b: number;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else {
    return { r: 0, g: 0, b: 0, isValid: false };
  }

  // Attenuate intensity near the ends of visible spectrum
  let factor = 1;
  if (wavelength >= 380 && wavelength < 420)
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  else if (wavelength >= 420 && wavelength <= 700) factor = 1;
  else if (wavelength > 700 && wavelength <= 780)
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);

  const cr = gammaCorrect(r * factor);
  const cg = gammaCorrect(g * factor);
  const cb = gammaCorrect(b * factor);

  return {
    r: Math.round(cr * 255),
    g: Math.round(cg * 255),
    b: Math.round(cb * 255),
    isValid: true,
  };
}
