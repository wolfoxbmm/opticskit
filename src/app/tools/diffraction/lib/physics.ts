/**
 * 2D Fraunhofer diffraction physics calculations.
 */

export interface DiffractionParams {
  mode: 'single' | 'double' | 'grating';
  wavelengthNm: number;  // nm
  slitWidthUm: number;   // μm
  slitSepUm: number;     // μm (for double & grating)
  slitCount: number;     // (for grating)
  screenDistMm: number;  // mm
}

/**
 * Compute 2D intensity distribution on a screen.
 * Returns a flat Float32Array of size width*height, normalized to [0, 1].
 */
export function compute2DIntensity(
  params: DiffractionParams,
  width: number,
  height: number,
  xRangeMm: number
): Float32Array {
  const wl = params.wavelengthNm * 1e-9;
  const a = params.slitWidthUm * 1e-6;
  const d = params.slitSepUm * 1e-6;
  const L = params.screenDistMm * 1e-3;
  const N = params.slitCount;

  const result = new Float32Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  const scale = width / xRangeMm;

  // yRange proportional to xRange based on aspect ratio
  const yRangeMm = (height / width) * xRangeMm;

  let maxI = 0;
  for (let py = 0; py < height; py++) {
    const y_mm = (py - cy) / scale;
    const sinThetaY = Math.sin(Math.atan2(y_mm, params.screenDistMm));

    for (let px = 0; px < width; px++) {
      const x_mm = (px - cx) / scale;
      const sinThetaX = Math.sin(Math.atan2(x_mm, params.screenDistMm));

      let I: number;
      if (params.mode === 'single') {
        I = singleSlit2D(sinThetaX, sinThetaY, a, wl);
      } else if (params.mode === 'double') {
        I = doubleSlit2D(sinThetaX, sinThetaY, a, d, wl);
      } else {
        I = grating2D(sinThetaX, sinThetaY, a, d, N, wl);
      }

      const idx = py * width + px;
      result[idx] = I;
      if (I > maxI) maxI = I;
    }
  }

  // Normalize
  if (maxI > 1e-12) {
    for (let i = 0; i < result.length; i++) {
      result[i] /= maxI;
    }
  }

  return result;
}

/**
 * Compute 1D intensity array for a horizontal profile (used for curve plot).
 */
export function compute1DIntensity(
  params: DiffractionParams,
  numPoints: number,
  xRangeMm: number
): Float32Array {
  const wl = params.wavelengthNm * 1e-9;
  const a = params.slitWidthUm * 1e-6;
  const d = params.slitSepUm * 1e-6;
  const L = params.screenDistMm * 1e-3;
  const N = params.slitCount;

  const result = new Float32Array(numPoints);
  let maxI = 0;

  for (let i = 0; i < numPoints; i++) {
    const x_mm = ((i / (numPoints - 1)) - 0.5) * xRangeMm;
    const theta = Math.atan2(x_mm, L);
    const sinTheta = Math.sin(theta);

    let I: number;
    const beta = (Math.PI * a * sinTheta) / wl;
    const sinc = Math.abs(beta) < 1e-9 ? 1 : Math.sin(beta) / beta;

    if (params.mode === 'single') {
      I = sinc * sinc;
    } else if (params.mode === 'double') {
      const gamma = (Math.PI * d * sinTheta) / wl;
      I = sinc * sinc * Math.cos(gamma) * Math.cos(gamma);
    } else {
      const gamma = (Math.PI * d * sinTheta) / wl;
      const absSinGamma = Math.abs(Math.sin(gamma));
      let interference: number;
      if (absSinGamma < 1e-9) {
        interference = 1;
      } else {
        const num = Math.sin(N * gamma);
        const denom = Math.sin(gamma);
        interference = (num / denom) * (num / denom) / (N * N);
      }
      I = sinc * sinc * interference;
    }

    result[i] = I;
    if (I > maxI) maxI = I;
  }

  if (maxI > 1e-12) {
    for (let i = 0; i < result.length; i++) {
      result[i] /= maxI;
    }
  }

  return result;
}

// --- 2D formulas ---

function sinc2D(x: number): number {
  return Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x;
}

function singleSlit2D(
  sinThetaX: number,
  sinThetaY: number,
  a: number,
  wl: number
): number {
  const alphaX = (Math.PI * a * sinThetaX) / wl;
  const alphaY = (Math.PI * a * sinThetaY) / wl;
  // Rectangular slit: width a in x, much taller in y (slit approximation)
  // Use a tall slit (height proportional to what's visible)
  const sx = sinc2D(alphaX);
  const sy = sinc2D(alphaY * 0.1); // very wide in y → ≈1 for most angles
  return sx * sx * sy * sy;
}

function doubleSlit2D(
  sinThetaX: number,
  sinThetaY: number,
  a: number,
  d: number,
  wl: number
): number {
  const alphaX = (Math.PI * a * sinThetaX) / wl;
  const gammaX = (Math.PI * d * sinThetaX) / wl;
  const alphaY = (Math.PI * a * sinThetaY) / wl;
  const gammaY = (Math.PI * d * sinThetaY) / wl;

  const sx = sinc2D(alphaX);
  const sy = sinc2D(alphaY * 0.1);
  const ifx = Math.cos(gammaX);
  const ify = Math.cos(gammaY * 0.1);

  return sx * sx * sy * sy * ifx * ifx * ify * ify;
}

function grating2D(
  sinThetaX: number,
  sinThetaY: number,
  a: number,
  d: number,
  N: number,
  wl: number
): number {
  const alphaX = (Math.PI * a * sinThetaX) / wl;
  const gammaX = (Math.PI * d * sinThetaX) / wl;
  const alphaY = (Math.PI * a * sinThetaY) / wl;
  const gammaY = (Math.PI * d * sinThetaY) / wl;

  const sx = sinc2D(alphaX);
  const sy = sinc2D(alphaY * 0.1);

  let ifx: number;
  const absSinGX = Math.abs(Math.sin(gammaX));
  if (absSinGX < 1e-9) {
    ifx = 1;
  } else {
    ifx = (Math.sin(N * gammaX) / (N * Math.sin(gammaX)));
  }

  let ify: number;
  const gY = gammaY * 0.1;
  const absSinGY = Math.abs(Math.sin(gY));
  if (absSinGY < 1e-9) {
    ify = 1;
  } else {
    ify = (Math.sin(N * gY) / (N * Math.sin(gY)));
  }

  return sx * sx * sy * sy * ifx * ifx * ify * ify;
}
