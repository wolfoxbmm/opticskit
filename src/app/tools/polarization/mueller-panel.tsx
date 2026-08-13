// app/tools/polarization/mueller-panel.tsx

"use client";

import { Card, CardTitle } from "./jones-panel";

export function MuellerPanel() {
  return (
    <Card>
      <CardTitle>Mueller 级联（含退偏）</CardTitle>
      <p className="text-sm" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
        Mueller 级联功能正在开发中，将支持非偏振光和部分偏振光的 Stokes-Mueller 分析。当前请使用 Jones 级联 Tab。
      </p>
    </Card>
  );
}
