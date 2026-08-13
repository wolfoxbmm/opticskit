import { describe, it, expect } from "vitest";
import {
  xyToUvPrime,
  uvPrimeToXy,
  xyToXYZ,
  xyzToChromaticity,
  cctWithDuv,
  wavelengthToColor,
  gammaCorrect,
  gammaDecode,
  clipSRGB,
  xyzToLab,
  deltaE76,
  pointInGamut,
  nearestWavelength,
  spectrumToXYZ,
} from "../index";

const close = (a: number, b: number, tol = 1e-4) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe("xy ↔ u'v' 转换", () => {
  it("D65 白点 xy → u'v'", () => {
    const uv = xyToUvPrime(0.3127, 0.3290);
    close(uv.uPrime, 0.1978, 1e-3);
    close(uv.vPrime, 0.4683, 1e-3);
  });

  it("u'v' → xy 是 xy → u'v' 的逆运算", () => {
    const xy1 = { x: 0.25, y: 0.4 };
    const uv = xyToUvPrime(xy1.x, xy1.y);
    const xy2 = uvPrimeToXy(uv.uPrime, uv.vPrime);
    close(xy1.x, xy2.x);
    close(xy1.y, xy2.y);
  });

  it("等能白点 (1/3, 1/3) 往返稳定", () => {
    const uv = xyToUvPrime(1 / 3, 1 / 3);
    const xy = uvPrimeToXy(uv.uPrime, uv.vPrime);
    close(1 / 3, xy.x);
    close(1 / 3, xy.y);
  });
});

describe("xy → XYZ", () => {
  it("等能白点 Y 归一化", () => {
    const X = xyToXYZ(1 / 3, 1 / 3, 1);
    close(X.X, 1);
    close(X.Y, 1);
    close(X.Z, 1);
  });

  it("y=0 时安全返回零（除零保护）", () => {
    const X = xyToXYZ(0.3, 0, 1);
    expect(X.Y).toBe(0);
  });
});

describe("CCT（相关色温）", () => {
  it("D65 白点 u'v' → CCT 约 6500K", () => {
    const uv = xyToUvPrime(0.3127, 0.3290);
    const { cct } = cctWithDuv(uv);
    // CCT 应在 6200~6800 之间（D65 标准相关色温约 6504K）
    expect(cct).toBeGreaterThan(6000);
    expect(cct).toBeLessThan(7000);
  });
});

describe("sRGB gamma 编解码", () => {
  it("gamma 编码/解码互逆", () => {
    for (const v of [0.001, 0.05, 0.5, 0.9, 1.0]) {
      const enc = gammaCorrect(v);
      close(gammaDecode(enc), v, 1e-3);
    }
  });

  it("线性中点约映射到 0.735（sRGB 标准）", () => {
    // sRGB gamma: 0.5 linear → 0.5^(1/2.4)*1.055-0.055 ≈ 0.735
    close(gammaCorrect(0.5), 0.735, 0.01);
  });
});

describe("XYZ → Lab（D65 白）", () => {
  it("D65 白点 Lab 应为 (100, 0, 0)", () => {
    const lab = xyzToLab({ X: 0.95047, Y: 1.0, Z: 1.08883 });
    close(lab.L, 100, 0.1);
    close(lab.a, 0, 0.1);
    close(lab.b, 0, 0.1);
  });

  it("同色 deltaE76 为 0", () => {
    expect(deltaE76({ L: 50, a: 10, b: -20 }, { L: 50, a: 10, b: -20 })).toBeCloseTo(0, 10);
  });

  it("已知色差：L 差 1 则 ΔE=1", () => {
    expect(deltaE76({ L: 50, a: 0, b: 0 }, { L: 51, a: 0, b: 0 })).toBeCloseTo(1, 10);
  });
});

describe("波长 → 颜色", () => {
  it("已知波长返回确定颜色（纯函数）", () => {
    const c1 = wavelengthToColor(470);
    const c2 = wavelengthToColor(470);
    expect(c1).toEqual(c2);
    // 470nm 附近偏蓝：b 分量应较大
    expect(c1.b).toBeGreaterThan(c1.r);
  });

  it("越界波长返回黑色", () => {
    const c = wavelengthToColor(1000);
    expect(c.r).toBe(0);
    expect(c.g).toBe(0);
    expect(c.b).toBe(0);
  });
});

describe("色域判断 pointInGamut", () => {
  const sRGB = { R: [0.64, 0.33] as [number, number], G: [0.3, 0.6] as [number, number], B: [0.15, 0.06] as [number, number] };
  it("白点 (0.31, 0.33) 在 sRGB 内", () => {
    expect(pointInGamut(0.31, 0.33, sRGB.R, sRGB.G, sRGB.B)).toBe(true);
  });
  it("纯绿 (0.2, 0.75) 在 sRGB 外", () => {
    expect(pointInGamut(0.2, 0.75, sRGB.R, sRGB.G, sRGB.B)).toBe(false);
  });
});

describe("最近波长 nearestWavelength", () => {
  const locus = [
    { x: 0.1, y: 0.2, wl: 500 },
    { x: 0.2, y: 0.3, wl: 550 },
    { x: 0.3, y: 0.4, wl: 600 },
  ];
  it("返回最近的波长", () => {
    const r = nearestWavelength(0.21, 0.31, locus);
    expect(r?.wl).toBe(550);
  });
});
