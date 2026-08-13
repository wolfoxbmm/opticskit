// app/tools/polarization/matrix-display.tsx — Jones/Stokes 矩阵展示

"use client";

import React from "react";
import type { JonesMatrix } from "@/lib/optics/polarization";

interface Props {
  matrix: JonesMatrix;
}

export function MatrixDisplay({ matrix }: Props) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="text-xs font-mono border-collapse">
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              <td className="pr-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
                {ri === 0 ? '[' : '['}
              </td>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 text-right whitespace-nowrap" style={{ color: 'var(--text-primary, #111827)' }}>
                  {cell.re.toFixed(3)}{cell.im >= 0 ? '+' : '-'}{Math.abs(cell.im).toFixed(3)}i
                </td>
              ))}
              <td className="pl-2" style={{ color: 'var(--text-tertiary, #6B7280)' }}>
                {ri === matrix.length - 1 ? ']' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
