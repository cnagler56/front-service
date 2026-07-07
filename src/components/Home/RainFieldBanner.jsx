'use client';
import React from 'react';
import s from './RainFieldBanner.module.css';

/**
 * Animated home-page banner: spring planting. A soft grey sky, three layers
 * of falling rain, and young seedlings sprouting from wet soil on a stagger.
 *
 * Pure SVG + CSS, same architecture as the corn banner. With
 * prefers-reduced-motion the rain layers sit above the viewBox (invisible)
 * and the seedlings render fully grown — a calm, static scene.
 */

/* Deterministic pseudo-random (seeded) — Math.random() would break SSR hydration. */
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(17);
const SEEDLINGS = Array.from({ length: 26 }, (_, i) => ({
  x: Math.round(24 + i * 46 + (rnd() - 0.5) * 24),
  k: +(0.9 + rnd() * 0.45).toFixed(2),
  r: +(rnd() * 6 - 3).toFixed(1),
  d: +(rnd() * 2).toFixed(2),
  tone: i % 2,
}));

/* One rain layer: parallel streaks tiled across the width, drawn ABOVE the
   viewBox so the layer's translate animation carries them through the scene. */
function RainLayer({ className, count, seed, width }) {
  const r = mulberry32(seed);
  const drops = Array.from({ length: count }, (_, i) => {
    const x = Math.round(i * (1200 / count) + r() * 40);
    const y = -20 - Math.round(r() * 150);
    return { x, y };
  });
  return (
    <g className={className} stroke="#7f96a8" strokeWidth={width} strokeLinecap="round" opacity="0.5">
      {drops.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={p.x - 3} y2={p.y + 13} />
      ))}
    </g>
  );
}

const TONES = [
  { stem: '#46702f', leaf: '#4c7a34' },
  { stem: '#4f7a35', leaf: '#578540' },
];

function Seedling({ x, k, r, d, tone }) {
  const c = TONES[tone];
  return (
    <g transform={`translate(${x},150) rotate(${r}) scale(${k})`}>
      <g className={s.sway} style={{ '--d': `${d}s` }}>
        <g className={s.grow}>
          <path d="M0,0 C0.3,-5 -0.3,-10 0,-15" stroke={c.stem}
            strokeWidth="2" strokeLinecap="round" fill="none" />
          <path className={`${s.leaf} ${s.leaf1}`} fill={c.leaf}
            d="M0,-10 C-5,-13 -9,-17 -11,-22 C-7,-19 -3,-16 0,-13 Z" />
          <path className={`${s.leaf} ${s.leaf2}`} fill={c.leaf}
            d="M0,-13 C4,-16 8,-20 9,-25 C6,-21 3,-18 0,-15 Z" />
          <path className={`${s.leaf} ${s.leaf3}`} fill={c.stem}
            d="M-0.8,-15 C-0.8,-18 -0.3,-21 0,-23 C0.3,-21 0.8,-18 0.8,-15 Z" />
        </g>
      </g>
    </g>
  );
}

const RainFieldBanner = () => (
  <div className={s.banner} aria-hidden="true">
    <svg
      className={s.field}
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rainSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#4a3826" />
          <stop offset="100%" stopColor="#33281a" />
        </linearGradient>
      </defs>

      {/* heavy spring clouds */}
      <g className={s.cloud1} fill="#7d8d99" opacity="0.45">
        <ellipse cx="0" cy="18" rx="70" ry="14" />
        <ellipse cx="52" cy="12" rx="44" ry="11" />
        <ellipse cx="-48" cy="13" rx="40" ry="10" />
      </g>
      <g className={s.cloud2} fill="#8fa0ab" opacity="0.4">
        <ellipse cx="0" cy="34" rx="56" ry="11" />
        <ellipse cx="-40" cy="29" rx="34" ry="9" />
      </g>
      <g className={s.cloud3} fill="#75858f" opacity="0.35">
        <ellipse cx="0" cy="10" rx="80" ry="13" />
        <ellipse cx="56" cy="16" rx="46" ry="10" />
      </g>

      {/* rain — three layers at different speeds for depth */}
      <RainLayer className={s.rain1} count={22} seed={3}  width={1.6} />
      <RainLayer className={s.rain2} count={20} seed={13} width={1.2} />
      <RainLayer className={s.rain3} count={18} seed={31} width={0.9} />

      {/* seedlings */}
      {SEEDLINGS.map((p, i) => <Seedling key={i} {...p} />)}

      {/* wet soil with faint puddle glints */}
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5 L1200,170 L0,170 Z"
        fill="url(#rainSoil)"
      />
      <ellipse className={s.puddle} cx="310" cy="156" rx="42" ry="2.4" fill="#9fb4c0" opacity="0.3" />
      <ellipse className={s.puddle} cx="860" cy="159" rx="56" ry="2.6" fill="#9fb4c0" opacity="0.25" />
    </svg>

    <div className={s.tagline}>Rain makes grain.</div>
  </div>
);

export default RainFieldBanner;
