'use client';
import React from 'react';
import s from './WheatFieldBanner.module.css';

/**
 * Animated home-page banner: a ripe wheat field at golden hour. Stems rise
 * from the soil on a stagger, heads fill in, then the field sways with a
 * phase offset per plant so gusts appear to roll across it.
 *
 * Pure SVG + CSS, same architecture as CornFieldBanner. The grain head is
 * defined once in <defs> and stamped per plant with <use> to keep the DOM
 * small despite the density.
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

function makeRow({ seed, count, step, x0, y, kMin, kMax, back }) {
  const rnd = mulberry32(seed);
  const plants = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(x0 + i * step + (rnd() - 0.5) * step * 0.6);
    plants.push({
      x,
      y,
      k: +(kMin + rnd() * (kMax - kMin)).toFixed(2),
      r: +(rnd() * 6 - 3).toFixed(1),
      d: +(rnd() * 1.4).toFixed(2),
      /* sway phase follows x so the wind reads as a wave crossing the field */
      w: +((x / 1200) * 2.6).toFixed(2),
      tone: i % 2,
      back,
    });
  }
  return plants;
}

const BACK_ROW  = makeRow({ seed: 11, count: 30, step: 40, x0: 14, y: 147, kMin: 0.5,  kMax: 0.64, back: true });
const FRONT_ROW = makeRow({ seed: 29, count: 33, step: 36, x0: 20, y: 150, kMin: 0.86, kMax: 1.1,  back: false });

const TONES = [
  { stem: '#bf9e50', leaf: '#b0964a' },
  { stem: '#caa958', leaf: '#bda254' },
];

function WheatPlant({ x, y, k, r, d, w, tone, back }) {
  const c = TONES[tone];
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${k})`} opacity={back ? 0.45 : 1}>
      <g className={s.sway} style={{ '--d': `${d}s`, '--w': `${w}s` }}>
        <g className={s.grow}>
          {/* stem */}
          <path className={s.stem} d="M0,0 C0.6,-24 -0.6,-48 0,-68"
            stroke={c.stem} strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* two slim flag leaves */}
          <path className={`${s.leaf} ${s.leaf1}`} fill={c.leaf}
            d="M0,-18 C-7,-24 -13,-30 -15,-38 C-11,-32 -6,-27 0,-24 Z" />
          <path className={`${s.leaf} ${s.leaf2}`} fill={c.leaf}
            d="M0,-30 C6,-35 11,-41 12,-49 C9,-43 5,-38 0,-35 Z" />
          {/* grain head (shared def) */}
          <use href="#wheatHead" className={s.head} transform="translate(0,-68)" />
        </g>
      </g>
    </g>
  );
}

const WheatFieldBanner = () => (
  <div className={s.banner} aria-hidden="true">
    <svg
      className={s.field}
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* one grain head, stamped per plant: kernel pairs + fine awns */}
        <g id="wheatHead">
          <g stroke="#c9a952" strokeWidth="0.7" opacity="0.75" fill="none">
            <path d="M0,-14 L-4,-30" />
            <path d="M0,-15 L0,-32" />
            <path d="M0,-14 L4,-30" />
            <path d="M-1,-10 L-7,-24" />
            <path d="M1,-10 L7,-24" />
          </g>
          <g fill="#d9b45e">
            <ellipse cx="-2.4" cy="-2"    rx="2.3" ry="3.4" transform="rotate(-18 -2.4 -2)" />
            <ellipse cx="2.4"  cy="-4"    rx="2.3" ry="3.4" transform="rotate(18 2.4 -4)" />
            <ellipse cx="-2.4" cy="-7"    rx="2.3" ry="3.4" transform="rotate(-18 -2.4 -7)" />
            <ellipse cx="2.4"  cy="-9"    rx="2.3" ry="3.4" transform="rotate(18 2.4 -9)" />
            <ellipse cx="-2.2" cy="-12"   rx="2.2" ry="3.2" transform="rotate(-16 -2.2 -12)" />
            <ellipse cx="2.2"  cy="-13.5" rx="2.2" ry="3.2" transform="rotate(16 2.2 -13.5)" />
            <ellipse cx="0"    cy="-16.5" rx="2.1" ry="3.2" />
          </g>
        </g>
        <radialGradient id="wheatSunGlow">
          <stop offset="0%"  stopColor="#fdeab0" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#f7d98c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f7d98c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wheatHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#fff8e2" stopOpacity="0" />
          <stop offset="100%" stopColor="#fdf3d4" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="wheatSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#8a6f47" />
          <stop offset="100%" stopColor="#68512f" />
        </linearGradient>
      </defs>

      {/* low golden sun */}
      <circle className={s.sun} cx="960" cy="42" r="44" fill="url(#wheatSunGlow)" />
      <circle className={s.sun} cx="960" cy="42" r="13" fill="#f9e09a" opacity="0.9" />

      {/* pale warm clouds */}
      <g className={s.cloud1} fill="#ffffff" opacity="0.28">
        <ellipse cx="0" cy="30" rx="48" ry="8" />
        <ellipse cx="34" cy="25" rx="30" ry="6" />
      </g>
      <g className={s.cloud2} fill="#ffffff" opacity="0.2">
        <ellipse cx="0" cy="58" rx="36" ry="7" />
        <ellipse cx="-24" cy="54" rx="22" ry="5" />
      </g>

      {/* horizon haze */}
      <rect x="0" y="114" width="1200" height="36" fill="url(#wheatHaze)" />

      {/* the wheat — back row first */}
      {BACK_ROW.map((p, i) => <WheatPlant key={`b${i}`} {...p} />)}
      {FRONT_ROW.map((p, i) => <WheatPlant key={`f${i}`} {...p} />)}

      {/* soil */}
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5 L1200,170 L0,170 Z"
        fill="url(#wheatSoil)"
      />
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5"
        fill="none" stroke="#54402a" strokeWidth="1.4" opacity="0.5"
      />
    </svg>

    <div className={s.tagline}>Amber waves of grain.</div>
  </div>
);

export default WheatFieldBanner;
