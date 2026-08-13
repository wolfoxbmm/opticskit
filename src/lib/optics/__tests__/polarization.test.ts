import { describe, it, expect } from "vitest";
import {
  jonesPolarizer,
  jonesRetarder,
  jonesRotator,
  jonesToStokes,
  jonesFromPsiChi,
  toPoincareCoords,
  fractionalToDelay,
  delayToFractional,
  physicalToDelay,
  extractEllipseParams,
  computeJonesCascade,
} from "../polarization";

const close = (a: number, b: number, tol = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(tol);

describe("Jones 偏振片", () => {
  it("水平起偏器 J = [[1,0],[0,0]]", () => {
    const m = jonesPolarizer(0);
    close(m[0][0].re, 1);
    close(m[0][0].im, 0);
    close(m[1][1].re, 0);
  });

  it("垂直起偏器 J = [[0,0],[0,1]]", () => {
    const m = jonesPolarizer(90);
    close(m[0][0].re, 0);
    close(m[1][1].re, 1);
  });
});

describe("Jones 旋转器", () => {
  it("45° 旋转矩阵 [[c,-s],[s,c]]", () => {
    const m = jonesRotator(45);
    close(m[0][0].re, Math.SQRT1_2);
    close(m[0][1].re, -Math.SQRT1_2);
    close(m[1][0].re, Math.SQRT1_2);
    close(m[1][1].re, Math.SQRT1_2);
  });
});

describe("Jones 延迟片", () => {
  it("半波片 (δ=π) 把水平偏振翻转为垂直（带相位 i）", () => {
    const hwp = jonesRetarder(45, Math.PI);
    // HWP 快轴 45° 时，水平输入 [1,0] 输出 [0, i]（垂直偏振，相位 +90°）
    const ox = { re: hwp[0][0].re, im: hwp[0][0].im };
    const oy = { re: hwp[1][0].re, im: hwp[1][0].im };
    close(ox.re, 0, 1e-6);
    close(ox.im, 0, 1e-6);
    close(oy.re, 0, 1e-6);
    close(oy.im, 1, 1e-6);
  });
});

describe("Jones → Stokes", () => {
  it("水平线偏振 → [1,1,0,0]", () => {
    const s = jonesToStokes([{ re: 1, im: 0 }, { re: 0, im: 0 }]);
    close(s[0], 1);
    close(s[1], 1);
    close(s[2], 0);
    close(s[3], 0);
  });

  it("垂直线偏振 → [1,-1,0,0]", () => {
    const s = jonesToStokes([{ re: 0, im: 0 }, { re: 1, im: 0 }]);
    close(s[1], -1);
  });

  it("归一化后庞加莱球坐标在单位球上", () => {
    const s = jonesToStokes(jonesFromPsiChi(30, 15));
    const p = toPoincareCoords(s);
    const norm = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    close(norm, 1, 1e-6);
  });
});

describe("ψ/χ → Jones 矢量往返", () => {
  it("45° 线偏振 (χ=0) Stokes S2=1", () => {
    const j = jonesFromPsiChi(45, 0);
    const s = jonesToStokes(j);
    close(s[1], 0, 1e-6);
    close(s[2], 1, 1e-6);
  });
});

describe("延迟量换算", () => {
  it("fractional ↔ radian 互逆", () => {
    close(fractionalToDelay(delayToFractional(Math.PI)), Math.PI);
  });
  it("半波片 δ=π fractional=0.5", () => {
    close(delayToFractional(Math.PI), 0.5);
  });
  it("physicalToDelay 与波长反比", () => {
    const d1 = physicalToDelay(1000, 0.01, 500);
    const d2 = physicalToDelay(1000, 0.01, 1000);
    close(d1, d2 * 2, 1e-6);
  });
});

describe("偏振椭圆参数", () => {
  it("零光强返回零强度且不报错", () => {
    const p = extractEllipseParams([{ re: 0, im: 0 }, { re: 0, im: 0 }]);
    expect(p.intensity).toBeCloseTo(0);
  });
  it("纯水平偏振 handedness=linear", () => {
    const p = extractEllipseParams([{ re: 1, im: 0 }, { re: 0, im: 0 }]);
    expect(p.handedness).toBe("linear");
    close(p.psi, 0);
  });
});

describe("Jones 级联", () => {
  it("空级联返回输入本身", () => {
    const input: [{ re: number; im: number }, { re: number; im: number }] = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    const r = computeJonesCascade(input, []);
    close(r.finalVector[0].re, 1);
    close(r.finalVector[1].re, 0);
  });
});
