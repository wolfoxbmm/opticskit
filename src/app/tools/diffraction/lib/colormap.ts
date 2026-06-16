/**
 * Scientific colormaps for physics visualization.
 * All return [r, g, b] in 0-255 range for a given value t in [0, 1].
 */

export type ColormapName = 'jet' | 'hot' | 'inferno' | 'viridis' | 'parula' | 'thermal';

export function colormap(t: number, name: ColormapName = 'inferno'): [number, number, number] {
  const ct = Math.max(0, Math.min(1, t));
  switch (name) {
    case 'jet': return jet(ct);
    case 'hot': return hot(ct);
    case 'inferno': return inferno(ct);
    case 'viridis': return viridis(ct);
    case 'parula': return parula(ct);
    case 'thermal': return thermal(ct);
    default: return inferno(ct);
  }
}

// MATLAB jet colormap
function jet(t: number): [number, number, number] {
  if (t < 0.125) return [0, 0, Math.round(127.5 + 127.5 * (t / 0.125))];
  if (t < 0.375) return [0, Math.round(255 * ((t - 0.125) / 0.25)), 255];
  if (t < 0.625) return [Math.round(255 * ((t - 0.375) / 0.25)), 255, Math.round(255 * (1 - (t - 0.375) / 0.25))];
  if (t < 0.875) return [255, Math.round(255 * (1 - (t - 0.625) / 0.25)), 0];
  return [Math.round(255 * (1 - (t - 0.875) / 0.125) * 0.5), 0, 0];
}

// MATLAB hot colormap
function hot(t: number): [number, number, number] {
  const r = Math.round(Math.min(1, t * 3) * 255);
  const g = Math.round(Math.max(0, Math.min(1, t * 3 - 1)) * 255);
  const b = Math.round(Math.max(0, Math.min(1, t * 3 - 2)) * 255);
  return [r, g, b];
}

// Matplotlib inferno colormap
function inferno(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [0, 0, 4], [5, 2, 46], [15, 7, 99], [36, 16, 149],
    [69, 24, 179], [107, 33, 193], [148, 48, 182], [189, 71, 153],
    [226, 99, 114], [248, 135, 77], [254, 176, 45], [249, 216, 19],
    [252, 253, 164]
  ];
  return piecewiseLinear(t, stops);
}

// Matplotlib viridis colormap
function viridis(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [68, 1, 84], [59, 69, 140], [43, 122, 142], [47, 164, 110],
    [88, 196, 68], [158, 217, 47], [242, 234, 18], [253, 231, 37]
  ];
  return piecewiseLinear(t, stops);
}

// Approximate parula (MATLAB)
function parula(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [48, 18, 59], [69, 74, 137], [79, 127, 170], [71, 173, 187],
    [79, 209, 175], [155, 232, 112], [237, 241, 60], [249, 249, 20]
  ];
  return piecewiseLinear(t, stops);
}

// Thermal: dark blue → cyan → white → yellow → red
function thermal(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [3, 0, 30], [0, 0, 180], [0, 160, 255], [255, 255, 255],
    [255, 255, 0], [255, 50, 0], [128, 0, 0]
  ];
  return piecewiseLinear(t, stops);
}

function piecewiseLinear(t: number, stops: [number, number, number][]): [number, number, number] {
  const n = stops.length - 1;
  const idx = Math.min(Math.floor(t * n), n - 1);
  const frac = t * n - idx;
  const a = stops[idx];
  const b = stops[idx + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * frac),
    Math.round(a[1] + (b[1] - a[1]) * frac),
    Math.round(a[2] + (b[2] - a[2]) * frac),
  ];
}
