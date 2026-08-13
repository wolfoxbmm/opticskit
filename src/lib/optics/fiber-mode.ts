// lib/fiber-mode.ts — 阶跃折射率光纤 LP 模式求解核心算法
// 纯函数、无副作用，可单元测试

// ============================================================
// 贝塞尔函数（级数展开实现，V < 6 范围精度足够）
// ============================================================

/** 0 阶第一类贝塞尔函数 J0(x) */
export function besselJ0(x: number): number {
  // J0(x) = Σ (-1)^k (x/2)^(2k) / (k!)²
  let sum = 0;
  let term = 1;
  let k = 0;
  const x2 = (x / 2) * (x / 2);
  while (Math.abs(term) > 1e-15 && k < 100) {
    sum += term;
    k++;
    term = -term * x2 / (k * k);
  }
  return sum;
}

/** 1 阶第一类贝塞尔函数 J1(x) */
export function besselJ1(x: number): number {
  // J1(x) = Σ (-1)^k (x/2)^(2k+1) / (k!·(k+1)!)
  if (Math.abs(x) < 1e-12) return 0;
  let sum = 0;
  let term = x / 2;
  let k = 0;
  const x2 = (x / 2) * (x / 2);
  while (Math.abs(term) > 1e-15 && k < 100) {
    sum += term;
    k++;
    term = -term * x2 / (k * (k + 1));
  }
  return sum;
}

/** 0 阶第二类修正贝塞尔函数 K0(x)，x>0（Numerical Recipes bessk0，有理/多项式近似，精度≈1e-8） */
export function besselK0(x: number): number {
  if (x <= 0) return Infinity;
  if (x <= 2) {
    const y = x * x / 4;
    return (-Math.log(x / 2) * bessI0(x)) + (-0.57721566 + y * (0.42278420 + y * (0.23069756 + y * (0.03488590 + y * (0.00262698 + y * (0.00010750 + y * 0.00000740))))));
  } else {
    const y = 2 / x;
    return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + y * (-0.07832358 + y * (0.02189568 + y * (-0.01062446 + y * (0.00587872 + y * (-0.00251540 + y * 0.00053208))))));
  }
}

/** 1 阶第二类修正贝塞尔函数 K1(x)，x>0（Numerical Recipes bessk1） */
export function besselK1(x: number): number {
  if (x <= 0) return Infinity;
  if (x <= 2) {
    const y = x * x / 4;
    return (Math.log(x / 2) * bessI1(x)) + (1 / x) * (1 + y * (0.15443144 + y * (-0.67278579 + y * (-0.18156897 + y * (-0.01919402 + y * (-0.00110404 + y * (-0.00004686)))))));
  } else {
    const y = 2 / x;
    return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 + y * (0.23498619 + y * (-0.03655620 + y * (0.01504268 + y * (-0.00780353 + y * (0.00325614 + y * (-0.00068245)))))));
  }
}

function bessI0(x: number): number {
  let ax = Math.abs(x), ans, y;
  if (ax < 3.75) {
    y = x / 3.75; y *= y;
    ans = 1 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813)))));
  } else {
    y = 3.75 / ax;
    ans = (Math.exp(ax) / Math.sqrt(ax)) * (0.39894228 + y * (0.01328592 + y * (0.00225319 + y * (-0.00157565 + y * (0.00916281 + y * (-0.02057706 + y * (0.02635537 + y * (-0.01647633 + y * 0.00392377))))))));
  }
  return ans;
}

function bessI1(x: number): number {
  let ax = Math.abs(x), ans, y;
  if (ax < 3.75) {
    y = x / 3.75; y *= y;
    ans = ax * (0.5 + y * (0.87890594 + y * (0.51498869 + y * (0.15084934 + y * (0.02658733 + y * (0.00301532 + y * 0.00032411))))));
  } else {
    y = 3.75 / ax;
    ans = 0.2282967e-1 + y * (-0.2895312e-1 + y * (0.1787654e-1 - y * 0.420059e-2));
    ans = 0.39894228 + y * (-0.03988024 + y * (-0.00362018 + y * (0.00163801 + y * (-0.01031555 + y * (0.02282967 + y * (-0.02895312 + y * (0.01787654 + y * (-0.00420059 + y * ans))))))));
    ans *= Math.exp(ax) / Math.sqrt(ax);
  }
  return x < 0 ? -ans : ans;
}

// 用数值积分统一 K0/K1（保证正确，牺牲一点性能——但光纤计算量很小）
export function besselK0_numeric(x: number): number {
  if (x <= 0) return Infinity;
  // K0(x) = ∫_0^∞ e^{-x·cosh(u)} du
  let sum = 0;
  const h = 0.05;
  for (let u = 0; u <= 40; u += h) {
    sum += Math.exp(-x * Math.cosh(u)) * h;
  }
  return sum;
}

export function besselK1_numeric(x: number): number {
  if (x <= 0) return Infinity;
  let sum = 0;
  const h = 0.05;
  for (let u = 0; u <= 40; u += h) {
    const cu = Math.cosh(u);
    sum += Math.exp(-x * cu) * cu * h;
  }
  return sum;
}

// ============================================================
// 光纤/模式参数类型
// ============================================================

export interface FiberParams {
  coreRadiusUm: number;    // 纤芯半径 a（μm）
  nCore: number;           // 纤芯折射率 n1
  nClad: number;           // 包层折射率 n2
}

export interface ModeResult {
  l: number;
  m: number;
  label: string;
  Vc: number;
  U: number;
  W: number;
  beta: number;
  neff: number;
  mfdUm: number;
  isGuided: boolean;
}

export const LP_CUTOFF_V: Record<string, number> = {
  'LP01': 0,
  'LP11': 2.4048255577,
  'LP21': 3.8317059702,
  'LP02': 3.8317059702,
  'LP31': 5.1356223018,
  'LP12': 5.5200781103,
  'LP41': 6.3801618959,
};

export function vNumber(fiber: FiberParams, lambdaUm: number): number {
  const na = numericalAperture(fiber);
  return (2 * Math.PI * fiber.coreRadiusUm / lambdaUm) * na;
}

export function numericalAperture(fiber: FiberParams): number {
  return Math.sqrt(Math.max(fiber.nCore * fiber.nCore - fiber.nClad * fiber.nClad, 0));
}

// 特征方程（弱导近似，LP 模式）
function charEquation(U: number, W: number, l: number): number {
  if (l === 0) {
    const j0 = besselJ0(U), j1 = besselJ1(U);
    const k0 = besselK0(W), k1 = besselK1(W);
    if (j0 === 0 || k0 === 0) return Infinity;
    return U * j1 / j0 - W * k1 / k0;
  } else if (l === 1) {
    const j0 = besselJ0(U), j1 = besselJ1(U);
    const k0 = besselK0(W), k1 = besselK1(W);
    if (j1 === 0 || k1 === 0) return Infinity;
    return U * j0 / j1 + W * k0 / k1;
  } else {
    // 高阶 l 用近似（弱导下高阶影响小）
    const j0 = besselJ0(U), j1 = besselJ1(U);
    const k0 = besselK0(W), k1 = besselK1(W);
    if (j1 === 0 || k1 === 0) return Infinity;
    return U * j0 / j1 + W * k0 / k1;
  }
}

function bisect(a: number, b: number, V: number, l: number): number {
  let lo = a, hi = b;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const W = Math.sqrt(Math.max(V * V - mid * mid, 1e-12));
    const f = charEquation(mid, W, l);
    const Wlo = Math.sqrt(Math.max(V * V - lo * lo, 1e-12));
    const flo = charEquation(lo, Wlo, l);
    if (flo * f <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

export function solveU(V: number, l: number, m: number): number {
  if (V <= 0) return 0;
  const N = 500;
  let prevF = 0, prevU = 0;
  const roots: number[] = [];
  for (let i = 1; i <= N; i++) {
    const U = (V * i) / N;
    if (U >= V - 1e-9) break;
    const W = Math.sqrt(Math.max(V * V - U * U, 1e-12));
    const f = charEquation(U, W, l);
    if (i > 1 && ((f > 0 && prevF < 0) || (f < 0 && prevF > 0))) {
      roots.push(bisect(prevU, U, V, l));
    }
    prevF = f; prevU = U;
  }
  return roots[m - 1] ?? 0;
}

export function marcuseMFD(fiber: FiberParams, lambdaUm: number): number {
  const V = vNumber(fiber, lambdaUm);
  if (V <= 0) return Infinity;
  const factor = 0.65 + 1.619 / Math.pow(V, 1.5) + 2.879 / Math.pow(V, 6);
  return 2 * fiber.coreRadiusUm * factor;
}

// Sellmeier 色散
export interface SellmeierCoeff {
  name: string;
  B: [number, number, number];
  C: [number, number, number];
}

export const SELLMEIER: SellmeierCoeff[] = [
  { name: '熔融石英 SiO₂', B: [0.6961663, 0.4079426, 0.8974794], C: [0.00467914826, 0.0135120631, 97.9340025] },
  { name: '锗掺杂 SiO₂ (3.1%)', B: [0.7028554, 0.4146307, 0.8974540], C: [0.0050188224, 0.0145342123, 98.1475149] },
  { name: '锗掺杂 SiO₂ (5.8%)', B: [0.7088849, 0.4206803, 0.8956551], C: [0.0054845219, 0.0150570610, 98.2460050] },
  { name: '锗掺杂 SiO₂ (7.0%)', B: [0.7110400, 0.4236170, 0.8946590], C: [0.0056503880, 0.0151991540, 98.2905760] },
];

export function sellmeierN(coeff: SellmeierCoeff, lambdaUm: number): number {
  const l2 = lambdaUm * lambdaUm;
  let n2 = 1;
  for (let i = 0; i < 3; i++) {
    n2 += (coeff.B[i] * l2) / (l2 - coeff.C[i]);
  }
  return Math.sqrt(n2);
}

export function materialDispersion(coeff: SellmeierCoeff, lambdaUm: number): number {
  // D = -(λ/c)·d²n/dλ²  [ps/(nm·km)]
  // λ 单位 μm，c=0.299792458 μm/ps，n'' 单位 μm⁻²
  // -(λ/c)·n'' 得到 ps/μm，×10⁶→ps/km，÷1000(μm→nm)→ps/(nm·km)
  // 净因子：×10³
  const h = lambdaUm * 1e-4;
  const nP = sellmeierN(coeff, lambdaUm + h);
  const nM = sellmeierN(coeff, lambdaUm - h);
  const n0 = sellmeierN(coeff, lambdaUm);
  const nDbl = (nP - 2 * n0 + nM) / (h * h); // μm⁻²
  const c = 0.299792458; // μm/ps
  return -(lambdaUm / c) * nDbl * 1000; // ps/(nm·km)
}

export function isSingleMode(fiber: FiberParams, lambdaUm: number): boolean {
  return vNumber(fiber, lambdaUm) < LP_CUTOFF_V['LP11'];
}

// ============================================================
// 色散（材料色散 + 波导色散 → 总色散）
// ============================================================

/**
 * 波导色散 D_w [ps/(nm·km)]：基于归一化传播常数 b 的解析近似。
 * D_w = -(n1-n2)/(c·λ) · V · d²(Vb)/dV²
 * LP01 弱导近似下 d(Vb)/dV 可用解析式逼近（避免数值二阶导噪声）。
 */
export function waveguideDispersion(fiber: FiberParams, lambdaUm: number): number {
  const n1 = fiber.nCore, n2 = fiber.nClad;
  const dn = n1 - n2;
  const c = 0.299792458; // μm/ps
  const V = vNumber(fiber, lambdaUm);

  // LP01 归一化传播常数 b 的解析近似（弱导，覆盖单模区 V<2.405）：
  // 用经验公式 b ≈ (1 - 1/(W_V))^2，其中 W_V = sqrt(1 + (2V/ ... )) 之类
  // 采用广泛使用的近似：b = (1.1428 - 0.9960/V)² （适用于 1.5 ≤ V ≤ 2.5）
  const b = Math.pow(1.1428 - 0.9960 / V, 2);

  // 解析求 d(Vb)/dV 和 d²(Vb)/dV²
  // 令 a0=1.1428, a1=0.9960，b=(a0 - a1/V)² = a0² - 2a0·a1/V + a1²/V²
  // Vb = a0²V - 2a0·a1 + a1²/V
  // d(Vb)/dV = a0² - a1²/V²
  // d²(Vb)/dV² = 2a1²/V³
  const d2Vb = 2 * 0.9960 * 0.9960 / (V * V * V);

  // D_w = -(dn/(c·λ)) · V · d²(Vb)/dV²  （单位经换算为 ps/(nm·km)）
  // dn 无量纲，c 单位 μm/ps，λ 单位 μm，得到 ps/μm，×10³→ps/(nm·km)
  const D_w_ps_per_um = -(dn / (c * lambdaUm)) * V * d2Vb;
  return D_w_ps_per_um * 1000;
}

/**
 * 总色散 D_total = 材料色散 D_mat + 波导色散 D_w  [ps/(nm·km)]
 */
export function totalDispersion(fiber: FiberParams, lambdaUm: number, coeff: SellmeierCoeff): number {
  return materialDispersion(coeff, lambdaUm) + waveguideDispersion(fiber, lambdaUm);
}

export function cutoffWavelength(fiber: FiberParams): number {
  const na = numericalAperture(fiber);
  if (na === 0) return Infinity;
  return (2 * Math.PI * fiber.coreRadiusUm * na) / LP_CUTOFF_V['LP11'];
}

export function solveModes(fiber: FiberParams, lambdaUm: number): ModeResult[] {
  const V = vNumber(fiber, lambdaUm);
  const k0 = 2 * Math.PI / lambdaUm;
  const results: ModeResult[] = [];

  const modeList = [
    { l: 0, m: 1, label: 'LP01', Vc: LP_CUTOFF_V['LP01'] },
    { l: 1, m: 1, label: 'LP11', Vc: LP_CUTOFF_V['LP11'] },
    { l: 2, m: 1, label: 'LP21', Vc: LP_CUTOFF_V['LP21'] },
    { l: 0, m: 2, label: 'LP02', Vc: LP_CUTOFF_V['LP02'] },
    { l: 3, m: 1, label: 'LP31', Vc: LP_CUTOFF_V['LP31'] },
    { l: 1, m: 2, label: 'LP12', Vc: LP_CUTOFF_V['LP12'] },
    { l: 4, m: 1, label: 'LP41', Vc: LP_CUTOFF_V['LP41'] },
  ];

  for (const mode of modeList) {
    if (V <= mode.Vc) continue;
    const U = solveU(V, mode.l, mode.m);
    if (U <= 0) continue;
    const W = Math.sqrt(Math.max(V * V - U * U, 0));
    // 传播常数：β = sqrt((n1·k0)² - (U/a)²)，其中 a 单位 μm，k0=2π/λ 单位 μm⁻¹
    const k0n1 = fiber.nCore * k0;
    const beta = Math.sqrt(Math.max(k0n1 * k0n1 - (U / fiber.coreRadiusUm) * (U / fiber.coreRadiusUm), 0));
    const neff = beta / k0;

    results.push({
      l: mode.l, m: mode.m, label: mode.label, Vc: mode.Vc,
      U, W, beta, neff,
      mfdUm: mode.label === 'LP01' ? marcuseMFD(fiber, lambdaUm) : 0,
      isGuided: true,
    });
  }
  return results;
}

// ============================================================
// 模场分布（径向场 + 2D 横向强度）
// ============================================================

/**
 * l 阶 Bessel 第一类（l=0,1 级数精确；l>=2 用递推 J_{l+1}=(2l/x)J_l - J_{l-1}）
 */
export function jlApprox(l: number, x: number): number {
  if (l === 0) return besselJ0(x);
  if (l === 1) return besselJ1(x);
  if (Math.abs(x) < 1e-9) return 0;
  let jnm1 = besselJ0(x);
  let jn = besselJ1(x);
  for (let n = 1; n < l; n++) {
    const jnp1 = (2 * n / x) * jn - jnm1;
    jnm1 = jn;
    jn = jnp1;
  }
  return jn;
}

/**
 * 径向场函数 R_l(r)：芯内 J_l(U·r/a)，包层内 C·K_l(W·r/a)
 * 系数 C=J_l(U)/K_l(W) 保证场在芯/包边界 r=a 处连续（物理要求）
 */
export function radialField(l: number, U: number, W: number, a: number, r: number): number {
  if (r <= a) {
    return jlApprox(l, (U * r) / a);
  } else {
    const x = (W * r) / a;
    const kU = l === 0 ? besselK0(W) : (l === 1 ? besselK1(W) : besselK0(W));
    const jU = jlApprox(l, U);
    const C = kU > 0 ? jU / kU : 0;
    if (l === 0) return C * besselK0(x);
    if (l === 1) return C * besselK1(x);
    return C * besselK0(x); // l>1 包层用 K0 近似（径向包层衰减速率相近）
  }
}

/**
 * LP_lm 模式横向强度分布 I(r,θ) ∝ R_l(r)² · cos²(lθ)
 * l=0 时角度均匀（中心亮斑），l>=1 时呈 2l 瓣结构。返回原始强度（未归一）。
 */
export function modeIntensity(l: number, U: number, W: number, a: number, r: number, theta: number): number {
  const R = radialField(l, U, W, a, r);
  const ang = l === 0 ? 1 : Math.cos(l * theta) * Math.cos(l * theta);
  return R * R * ang;
}
