'use client';

import { useMemo, useState } from 'react';

/** One point on a line. */
interface Point { year: number; value: number; }

/** One line on the chart. */
export interface Series { state: string; color: string; points: Point[]; }

/** Tableau-ish palette — distinct enough for ~10 lines on screen. */
const PALETTE = [
  '#3d6b2a', // primary green (matches site)
  '#b91c1c', // red
  '#1d4ed8', // blue
  '#a16207', // amber
  '#7c3aed', // purple
  '#0f766e', // teal
  '#c2410c', // orange
  '#374151', // grey
  '#be185d', // pink
  '#65a30d', // lime
];

export function colorFor(idx: number) { return PALETTE[idx % PALETTE.length]; }

interface Props {
  series: Series[];
  width?: number;
  height?: number;
  yLabel?: string;
}

export default function YieldHistoryChart({
  series,
  width = 720,
  height = 320,
  yLabel = 'Yield (bu/acre)',
}: Props) {
  const [hover, setHover] = useState<{ year: number; x: number } | null>(null);

  // Compute domain from all visible series
  const { years, minY, maxY } = useMemo(() => {
    const yrs = new Set<number>();
    let lo = Infinity, hi = -Infinity;
    for (const s of series) {
      for (const pt of s.points) {
        yrs.add(pt.year);
        if (pt.value < lo) lo = pt.value;
        if (pt.value > hi) hi = pt.value;
      }
    }
    const arr = Array.from(yrs).sort((a, b) => a - b);
    if (!arr.length) return { years: [], minY: 0, maxY: 1 };
    // Pad y-range 5%
    const pad = (hi - lo) * 0.08 || 1;
    return { years: arr, minY: Math.max(0, lo - pad), maxY: hi + pad };
  }, [series]);

  // Margins
  const m = { top: 20, right: 24, bottom: 36, left: 56 };
  const innerW = width  - m.left - m.right;
  const innerH = height - m.top  - m.bottom;

  if (!years.length) {
    return (
      <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
        No data to plot.
      </p>
    );
  }

  // Scales
  const x = (year: number) => {
    if (years.length === 1) return innerW / 2;
    return ((year - years[0]) / (years[years.length - 1] - years[0])) * innerW;
  };
  const y = (val: number) => innerH - ((val - minY) / (maxY - minY)) * innerH;

  // Y-axis ticks (5 evenly spaced)
  const yTicks = Array.from({ length: 5 }, (_, i) => minY + (i / 4) * (maxY - minY));

  // Closest year for tooltip
  const closestYear = (px: number): number => {
    let best = years[0]; let bestDist = Infinity;
    for (const yr of years) {
      const d = Math.abs(x(yr) - px);
      if (d < bestDist) { bestDist = d; best = yr; }
    }
    return best;
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ background: '#fdfaf4', borderRadius: 6, border: '1px solid #e1dccc' }}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          // Account for any horizontal scroll offset
          const ratio = width / rect.width;
          const px = (e.clientX - rect.left) * ratio - m.left;
          if (px < 0 || px > innerW) { setHover(null); return; }
          const yr = closestYear(px);
          setHover({ year: yr, x: x(yr) });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <g transform={`translate(${m.left},${m.top})`}>
          {/* Y axis gridlines + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} stroke="#e8e1d0" strokeDasharray="3,3" />
              <text x={-8} y={y(t)} dy="0.35em" textAnchor="end"
                fontFamily="Lato, sans-serif" fontSize={11} fill="#888">
                {Math.round(t)}
              </text>
            </g>
          ))}
          {/* X axis labels */}
          {years.map(yr => (
            <text key={yr} x={x(yr)} y={innerH + 18} textAnchor="middle"
              fontFamily="Lato, sans-serif" fontSize={11} fill="#666">
              {yr}
            </text>
          ))}
          {/* Y axis title */}
          <text
            x={-m.left + 12}
            y={-6}
            fontFamily="Lato, sans-serif"
            fontSize={11}
            fill="#6a7a55"
            letterSpacing="0.05em"
            style={{ textTransform: 'uppercase' }}
          >
            {yLabel}
          </text>

          {/* Hover guide line */}
          {hover && (
            <line x1={hover.x} x2={hover.x} y1={0} y2={innerH}
              stroke="#2c4a1e" strokeOpacity={0.25} />
          )}

          {/* Series */}
          {series.map((s) => {
            const sorted = [...s.points].sort((a, b) => a.year - b.year);
            const path = sorted
              .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${x(pt.year)} ${y(pt.value)}`)
              .join(' ');
            return (
              <g key={s.state}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2}
                  strokeLinejoin="round" strokeLinecap="round" />
                {sorted.map((pt, i) => (
                  <circle key={i} cx={x(pt.year)} cy={y(pt.value)} r={3.5}
                    fill="#fff" stroke={s.color} strokeWidth={2} />
                ))}
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hover && (
            <g>
              {(() => {
                const rows = series
                  .map(s => ({ state: s.state, color: s.color,
                               pt: s.points.find(p => p.year === hover.year) }))
                  .filter(r => r.pt);
                if (!rows.length) return null;
                const w = 180, h = 22 + rows.length * 18;
                let tx = hover.x + 10;
                if (tx + w > innerW) tx = hover.x - w - 10;
                return (
                  <g transform={`translate(${tx},10)`}>
                    <rect width={w} height={h} fill="#fff" stroke="#ddd8cc" rx={4} />
                    <text x={10} y={16} fontFamily="Lato, sans-serif" fontSize={12}
                      fontWeight={700} fill="#2c4a1e">{hover.year}</text>
                    {rows.map((r, i) => (
                      <g key={r.state} transform={`translate(10, ${30 + i * 18})`}>
                        <rect width={8} height={8} y={-7} fill={r.color} rx={1} />
                        <text x={14} y={0} dy="0.3em" fontFamily="Lato, sans-serif" fontSize={11.5} fill="#444">
                          {r.state}
                        </text>
                        <text x={w - 10} y={0} dy="0.3em" textAnchor="end"
                          fontFamily="Lato, sans-serif" fontSize={11.5} fontWeight={600} fill="#1a2e0f">
                          {r.pt!.value.toLocaleString()}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
