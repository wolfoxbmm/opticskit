// lib/optics/polarization.ts — Jones/Stokes/Mueller 偏振计算核心库

export interface Complex {
  re: number;
  im: number;
}

export type JonesVector = [Complex, Complex];
export type JonesMatrix = [[Complex, Complex], [Complex, Complex]];

// ---- Complex math helpers ----
function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}
function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}
function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom < 1e-15) return { re: 0, im: 0 };
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}
function cAbs(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}
function cExp(phase: number): Complex {
  return { re: Math.cos(phase), im: Math.sin(phase) };
}
function cPhase(c: Complex): number {
  return Math.atan2(c.im, c.re);
}
function cFromPolar(r: number, theta: number): Complex {
  return { re: r * Math.cos(theta), im: r * Math.sin(theta) };
}

// ---- Matrix operations ----
function matMul2x2(a: JonesMatrix, b: JonesMatrix): JonesMatrix {
  // a × b
  return [
    [
      cAdd(cMul(a[0][0], b[0][0]), cMul(a[0][1], b[1][0])),
      cAdd(cMul(a[0][0], b[0][1]), cMul(a[0][1], b[1][1])),
    ],
    [
      cAdd(cMul(a[1][0], b[0][0]), cMul(a[1][1], b[1][0])),
      cAdd(cMul(a[1][0], b[0][1]), cMul(a[1][1], b[1][1])),
    ],
  ];
}

function matVecMul2x1(m: JonesMatrix, v: JonesVector): JonesVector {
  return [
    cAdd(cMul(m[0][0], v[0]), cMul(m[0][1], v[1])),
    cAdd(cMul(m[1][0], v[0]), cMul(m[1][1], v[1])),
  ];
}

// ---- Rotation matrix ----
function rotMatrix(phi: number): JonesMatrix {
  // R(φ) = [[cosφ, sinφ], [-sinφ, cosφ]]
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  return [
    [{ re: c, im: 0 }, { re: s, im: 0 }],
    [{ re: -s, im: 0 }, { re: c, im: 0 }],
  ];
}

// ---- Identity matrix ----
const IDENTITY: JonesMatrix = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
];

// ---- Predefined Jones vectors ----
export const PREDEFINED_JONES: Record<string, { vector: JonesVector; psi: number; chi: number }> = {
  H:  { vector: [{ re: 1, im: 0 }, { re: 0, im: 0 }], psi: 0,   chi: 0 },
  V:  { vector: [{ re: 0, im: 0 }, { re: 1, im: 0 }], psi: 90,  chi: 0 },
  D:  { vector: [{ re: 1/Math.SQRT2, im: 0 }, { re: 1/Math.SQRT2, im: 0 }], psi: 45,  chi: 0 },
  A:  { vector: [{ re: 1/Math.SQRT2, im: 0 }, { re: -1/Math.SQRT2, im: 0 }], psi: 135, chi: 0 },
  R:  { vector: [{ re: 1/Math.SQRT2, im: 0 }, { re: 0, im: -1/Math.SQRT2 }], psi: 0,   chi: 45 },
  L:  { vector: [{ re: 1/Math.SQRT2, im: 0 }, { re: 0, im: 1/Math.SQRT2 }],  psi: 0,   chi: -45 },
};

// ---- Jones matrix generators ----
export function jonesPolarizer(thetaDeg: number): JonesMatrix {
  const theta = thetaDeg * Math.PI / 180;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [
    [{ re: c * c, im: 0 }, { re: s * c, im: 0 }],
    [{ re: s * c, im: 0 }, { re: s * s, im: 0 }],
  ];
}

export function jonesRetarder(phiDeg: number, delta: number): JonesMatrix {
  // J = R(-φ) · diag(e^{+iδ/2}, e^{-iδ/2}) · R(φ)
  // Fast axis (x') leads by +δ/2 relative to slow axis (y')
  const phi = phiDeg * Math.PI / 180;
  const rm = rotMatrix(phi);
  const rmInv = rotMatrix(-phi);
  const diag: JonesMatrix = [
    [{ re: Math.cos(delta/2), im: Math.sin(delta/2) }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: Math.cos(delta/2), im: -Math.sin(delta/2) }],
  ];
  return matMul2x2(rmInv, matMul2x2(diag, rm));
}

export function jonesRotator(alphaDeg: number): JonesMatrix {
  const alpha = alphaDeg * Math.PI / 180;
  const c = Math.cos(alpha);
  const s = Math.sin(alpha);
  return [
    [{ re: c, im: 0 }, { re: -s, im: 0 }],
    [{ re: s, im: 0 }, { re: c, im: 0 }],
  ];
}

// PBS matrices
export const jonesPBS_T: JonesMatrix = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 0 }],
];
export const jonesPBS_R: JonesMatrix = [
  [{ re: 0, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
];

// ---- Element types ----
export type ElementType = 'polarizer' | 'hwp' | 'qwp' | 'fwp' | 'retarder' | 'rotator' | 'faraday' | 'pbs_t' | 'pbs_r';

export type DelayMode = 'radian' | 'fractional' | 'physical';

export interface ElementConfig {
  id: string;
  type: ElementType;
  label: string;
  phiDeg: number;        // fast axis / transmission axis angle
  delta: number;         // retardation in radians
  delayMode: DelayMode;  // for retarder display
  fractionalLambda: number; // 0.25 = λ/4 etc
  physicalDeltaN: number;  // for physical delay mode
  physicalD: number;        // thickness in nm
  locked: boolean;
}

export interface JonesCascadeResult {
  finalVector: JonesVector;
  chainMatrix: JonesMatrix;
  steps: Array<{
    elementId: string;
    elementLabel: string;
    afterVector: JonesVector;
  }>;
}

export interface PolarizationEllipseParams {
  psi: number;          // azimuth angle in degrees [0, 180)
  chi: number;          // ellipticity angle in degrees [-45, 45]
  ellipticity: number;  // short/long axis ratio
  handedness: 'linear' | 'right' | 'left';
  intensity: number;
  PER: number | null;   // polarization extinction ratio in dB, null for circular (0 dB) or ∞ for linear
}

// ---- Element label helper ----
export function elementLabel(type: ElementType, params: { phiDeg: number; delta?: number; delayMode?: DelayMode; fractionalLambda?: number }): string {
  switch (type) {
    case 'polarizer': return `偏振片 θ=${params.phiDeg}°`;
    case 'hwp': return `半波片 φ=${params.phiDeg}°`;
    case 'qwp': return `1/4波片 φ=${params.phiDeg}°`;
    case 'fwp': return `全波片 φ=${params.phiDeg}°`;
    case 'retarder':
      if (params.delayMode === 'fractional') return `延迟片 φ=${params.phiDeg}° δ=${params.fractionalLambda?.toFixed(3)}λ`;
      if (params.delayMode === 'physical') return `延迟片 φ=${params.phiDeg}° d=物理`;
      return `延迟片 φ=${params.phiDeg}° δ=${((params.delta || 0) * 180 / Math.PI).toFixed(1)}°`;
    case 'rotator': return `旋光器 α=${params.phiDeg}°`;
    case 'faraday': return `法拉第旋转 β=${params.phiDeg}°`;
    case 'pbs_t': return `PBS 透射`;
    case 'pbs_r': return `PBS 反射`;
    default: return '未知元件';
  }
}

// ---- Compute cascade ----
export function computeJonesCascade(
  input: JonesVector,
  elements: ElementConfig[]
): JonesCascadeResult {
  let currentVector = input;
  let chainMatrix: JonesMatrix = IDENTITY;
  const steps: JonesCascadeResult['steps'] = [];

  for (const el of elements) {
    let mat: JonesMatrix;
    switch (el.type) {
      case 'polarizer': mat = jonesPolarizer(el.phiDeg); break;
      case 'hwp': mat = jonesRetarder(el.phiDeg, Math.PI); break;
      case 'qwp': mat = jonesRetarder(el.phiDeg, Math.PI / 2); break;
      case 'fwp': mat = jonesRetarder(el.phiDeg, 2 * Math.PI); break;
      case 'retarder': mat = jonesRetarder(el.phiDeg, el.delta); break;
      case 'rotator': mat = jonesRotator(el.phiDeg); break;
      case 'faraday': mat = jonesRotator(el.phiDeg); break;
      case 'pbs_t': mat = jonesPBS_T; break;
      case 'pbs_r': mat = jonesPBS_R; break;
      default: mat = IDENTITY;
    }
    chainMatrix = matMul2x2(mat, chainMatrix);
    currentVector = matVecMul2x1(mat, currentVector);
    steps.push({
      elementId: el.id,
      elementLabel: elementLabel(el.type, { phiDeg: el.phiDeg, delta: el.delta, delayMode: el.delayMode, fractionalLambda: el.fractionalLambda }),
      afterVector: [
        { re: currentVector[0].re, im: currentVector[0].im },
        { re: currentVector[1].re, im: currentVector[1].im },
      ],
    });
  }

  return { finalVector: currentVector, chainMatrix, steps };
}

// ---- Extract polarization ellipse params from Jones vector ----
export function extractEllipseParams(j: JonesVector): PolarizationEllipseParams {
  const I = j[0].re * j[0].re + j[0].im * j[0].im + j[1].re * j[1].re + j[1].im * j[1].im;
  const EPS = 1e-10;

  // Edge case: zero intensity
  if (I < EPS) {
    return { psi: 0, chi: 0, ellipticity: 1, handedness: 'linear', intensity: 0, PER: null };
  }

  // Edge case: E_x ≈ 0 (vertical linear polarization)
  const exAbs = cAbs(j[0]);
  if (exAbs < EPS) {
    // Pure vertical
    return { psi: 90, chi: 0, ellipticity: 1, handedness: 'linear', intensity: I, PER: null };
  }

  // χ = E_y / E_x
  const chiRatio = cDiv(j[1], j[0]); // complex ratio

  // Azimuth ψ using atan2 for full [0, 180] range
  const num = 2 * (chiRatio.re * 1 - chiRatio.im * 0); // 2·Re(χ)  — but chiRatio is already complex, need Re(chiRatio)
  const reChi = chiRatio.re;
  const imChi = chiRatio.im;
  const absChiSq = reChi * reChi + imChi * imChi;

  let psi: number;
  if (Math.abs(1 - absChiSq) < EPS && Math.abs(imChi) > EPS) {
    // |χ| = 1 and Im(χ) ≠ 0 → circular polarization, ψ is undefined, set to 0
    psi = 0;
  } else {
    psi = 0.5 * Math.atan2(2 * reChi, 1 - absChiSq) * 180 / Math.PI;
    if (psi < 0) psi += 180;
    if (psi >= 180) psi -= 180;
  }

  // Ellipticity angle χ
  const chiArg = (2 * imChi) / (1 + absChiSq);
  const chiEllip = 0.5 * Math.asin(Math.max(-1, Math.min(1, chiArg))) * 180 / Math.PI;
  
  const e = Math.tan(chiEllip * Math.PI / 180);

  // Handedness: im(χ) > 0 → right-handed (χ_ellip > 0)
  let handedness: 'linear' | 'right' | 'left';
  if (Math.abs(chiEllip) < 0.05) {
    handedness = 'linear';
  } else if (chiEllip > 0) {
    handedness = 'right';
  } else {
    handedness = 'left';
  }

  // PER
  let PER: number | null = null;
  const absE = Math.abs(e);
  if (absE > 0.999) {
    PER = null; // effectively infinite (linear)
  } else if (absE < 0.001) {
    PER = 0;
  } else {
    PER = 10 * Math.log10((1 + absE) / (1 - absE));
  }

  return {
    psi: psi,
    chi: chiEllip,
    ellipticity: e,
    handedness,
    intensity: I,
    PER,
  };
}

// ---- Jones → Stokes ----
export function jonesToStokes(j: JonesVector): [number, number, number, number] {
  const Ex = j[0];
  const Ey = j[1];
  const S0 = cAbs(Ex) * cAbs(Ex) + cAbs(Ey) * cAbs(Ey);
  const S1 = cAbs(Ex) * cAbs(Ex) - cAbs(Ey) * cAbs(Ey);
  // E_x* E_y = (re_x - i·im_x) * (re_y + i·im_y) = re_x·re_y + im_x·im_y + i(re_x·im_y - im_x·re_y)
  const ExConjEy = cMul(
    { re: Ex.re, im: -Ex.im },
    Ey
  );
  const S2 = 2 * ExConjEy.re;
  const S3 = 2 * ExConjEy.im;
  return [S0, S1, S2, S3];
}

// ---- Poincare sphere coordinates ----
export function toPoincareCoords(stokes: [number, number, number, number]): { x: number; y: number; z: number } {
  const [S0, S1, S2, S3] = stokes;
  if (S0 < 1e-10) return { x: 0, y: 0, z: 0 };
  return { x: S1 / S0, y: S2 / S0, z: S3 / S0 };
}

// ---- Helper: build Jones vector from psi & chi ----
export function jonesFromPsiChi(psiDeg: number, chiDeg: number): JonesVector {
  const psi = psiDeg * Math.PI / 180;
  const chi = chiDeg * Math.PI / 180;
  const cPsi = Math.cos(psi);
  const sPsi = Math.sin(psi);
  const cChi = Math.cos(chi);
  const sChi = Math.sin(chi);
  // E = R(-psi) · [cos(χ), i·sin(χ)]^T
  const ex = cPsi * cChi - 0; // from rotation
  const eyImPart = cPsi * sChi;
  
  // Actually: E = [cos(ψ)cos(χ) - i·sin(ψ)sin(χ), sin(ψ)cos(χ) + i·cos(ψ)sin(χ)]
  const exRe = cPsi * cChi;
  const exIm = -sPsi * sChi;
  const eyRe = sPsi * cChi;
  const eyIm = cPsi * sChi;
  
  return [
    { re: exRe, im: exIm },
    { re: eyRe, im: eyIm },
  ];
}

// ---- Delay mode conversions ----
export function delayToFractional(delta: number): number {
  return delta / (2 * Math.PI);
}

export function fractionalToDelay(fractional: number): number {
  return fractional * 2 * Math.PI;
}

export function physicalToDelay(dNm: number, deltaN: number, wavelengthNm: number): number {
  if (wavelengthNm < 0.1) return 0;
  return 2 * Math.PI * deltaN * dNm / wavelengthNm;
}
