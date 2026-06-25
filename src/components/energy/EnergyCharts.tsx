'use client';

import React from 'react';
import { EthanolPoint } from '@/src/lib/api';

/** "2026-06-12" / "2026-03" → "Jun '26". */
function monthYear(p: string): string {
  const d = new Date(p.length === 7 ? p + '-01' : p);
  if (isNaN(d.getTime())) return p;
  return `${d.toLocaleDateString(undefined, { month: 'short' })} '${String(d.getFullYear() % 100).padStart(2, '0')}`;
}

export function StatCard({
  label, value, unit, sub, accent,
}: { label: string; value: string; unit?: string; sub?: React.ReactNode; accent: string }) {
  return (
    <div style={{
      flex: '1 1 180px', minWidth: 160,
      background: '#fff', border: '1px solid #e1dccc', borderLeft: `4px solid ${accent}`,
      borderRadius: 6, padding: '.7rem .9rem', fontFamily: 'Lato, sans-serif',
    }}>
      <div style={{ fontSize: '.66rem', textTransform: 'uppercase', letterSpacing: '.04em', color: '#6a7a55', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a2e0f', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: '.7rem', fontWeight: 400, color: '#888', marginLeft: '.35rem' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '.72rem', color: '#6a7a55', marginTop: '.2rem' }}>{sub}</div>}
    </div>
  );
}

/**
 * Responsive SVG line chart with gridlines + labeled axes. `fmtVal` controls how
 * the y-axis and the latest-point label are formatted (e.g. 2 decimals for $/gal).
 */
export function MiniLineChart({
  title, unit, points, color, fmtVal = (n) => Math.round(n).toLocaleString(),
}: {
  title: string; unit: string; points: EthanolPoint[]; color: string; fmtVal?: (n: number) => string;
}) {
  const W = 480, H = 250, padL = 54, padR = 14, padT = 16, padB = 28;
  const n = points.length;
  const vals = points.map(p => p.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.08, Math.abs(hi) * 0.02, 0.01);
  const dMin = lo - pad, dMax = hi + pad;
  const dSpan = Math.max(dMax - dMin, 1e-9);

  const x = (i: number) => padL + (i / Math.max(n - 1, 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - dMin) / dSpan) * (H - padT - padB);
  const baseY = y(dMin);

  const TICKS = 4;
  const yTicks = Array.from({ length: TICKS + 1 }, (_, k) => dMin + (k / TICKS) * dSpan);
  const xIdx = Array.from({ length: 4 }, (_, k) => Math.round((k / 3) * (n - 1)));

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${x(n - 1).toFixed(1)},${baseY.toFixed(1)} L${x(0).toFixed(1)},${baseY.toFixed(1)} Z`;
  const last = points[n - 1];

  return (
    <div style={{ border: '1px solid #e1dccc', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '.5rem',
        padding: '.7rem .9rem', borderBottom: '1px solid #eef0ea', borderLeft: `4px solid ${color}`,
      }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.05rem', fontWeight: 700, color: '#1a2e0f', lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.68rem', color: '#8aa06a', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: '.1rem' }}>
            {unit}
          </div>
        </div>
      </div>
      <div style={{ padding: '.7rem .9rem' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} fontFamily="Lato, sans-serif">
          {yTicks.map((v, k) => (
            <g key={k}>
              <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#eef0ea" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize={12} fill="#9aa886">{fmtVal(v)}</text>
            </g>
          ))}
          <path d={areaPath} fill={color} fillOpacity={0.12} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2.25} vectorEffect="non-scaling-stroke" />
          {xIdx.map((i, k) => (
            <text key={k} x={x(i)} y={H - 8}
              textAnchor={k === 0 ? 'start' : k === xIdx.length - 1 ? 'end' : 'middle'}
              fontSize={12} fill="#9aa886">
              {monthYear(points[i].period)}
            </text>
          ))}
          <circle cx={x(n - 1)} cy={y(last.value)} r={3.5} fill={color} />
          <text x={x(n - 1) - 6} y={y(last.value) - 7} textAnchor="end" fontSize={13} fontWeight={700} fill={color}>
            {fmtVal(last.value)}
          </text>
        </svg>
      </div>
    </div>
  );
}
