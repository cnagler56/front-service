'use client';
import React from 'react';
import s from './CornFieldBanner.module.css';

/**
 * Decorative animated banner for the home page: a row of corn stalks sprouts
 * from the soil (staggered, like a real field coming in), leaves unfurl,
 * tassels pop, and then the whole field sways gently in the breeze.
 *
 * Pure SVG + CSS — no libraries, nothing to load. Users with
 * prefers-reduced-motion just see the fully grown field, no animation.
 */

/* Deterministic pseudo-random (seeded) so the server and client render the
   exact same field — Math.random() here would cause hydration mismatches. */
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Two rows for a full-field look: a smaller, hazier back row for depth and a
   dense front row. Each plant: x, base y, size k, stagger d, tone, ear. */
function makeRow({ seed, count, step, x0, y, kMin, kMax, earEvery, back }) {
  const rnd = mulberry32(seed);
  const plants = [];
  for (let i = 0; i < count; i++) {
    plants.push({
      x: Math.round(x0 + i * step + (rnd() - 0.5) * step * 0.5),
      y,
      k: +(kMin + rnd() * (kMax - kMin)).toFixed(2),
      d: +(rnd() * 1.6).toFixed(2),
      tone: i % 2,
      ear: !back && i % earEvery === 2,
      back,
    });
  }
  return plants;
}

const BACK_ROW  = makeRow({ seed: 7,  count: 20, step: 61, x0: 18, y: 145, kMin: 0.48, kMax: 0.62, earEvery: 99, back: true });
const FRONT_ROW = makeRow({ seed: 21, count: 19, step: 64, x0: 40, y: 150, kMin: 0.84, kMax: 1.08, earEvery: 4,  back: false });

const TONES = [
  { stalk: '#2c4a1e', leaf: '#3d6b2a' },
  { stalk: '#456f2e', leaf: '#5c8f3d' },
];

function CornPlant({ x, y, k, d, tone, ear, back }) {
  const c = TONES[tone];
  return (
    <g transform={`translate(${x},${y}) scale(${k})`} opacity={back ? 0.55 : 1}>
      {/* sway wrapper — rotates around the soil point after growth */}
      <g className={s.sway} style={{ '--d': `${d}s` }}>
        {/* grow wrapper — the whole plant rises out of the ground */}
        <g className={s.grow}>
          {/* stalk */}
          <path
            className={s.stalk}
            d="M0,0 C1.5,-30 -1.5,-58 0,-88"
            stroke={c.stalk} strokeWidth="5" strokeLinecap="round" fill="none"
          />
          {/* leaves — arch out from the stalk and droop at the tip, like corn */}
          <path className={`${s.leaf} ${s.leafL} ${s.leaf1}`}
            d="M0,-26 C-12,-36 -27,-40 -35,-24" stroke={c.leaf}
            strokeWidth="5" strokeLinecap="round" fill="none" />
          <path className={`${s.leaf} ${s.leafR} ${s.leaf2}`}
            d="M0,-40 C12,-50 26,-54 33,-37" stroke={c.leaf}
            strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path className={`${s.leaf} ${s.leafL} ${s.leaf3}`}
            d="M0,-55 C-10,-64 -21,-67 -28,-53" stroke={c.leaf}
            strokeWidth="4" strokeLinecap="round" fill="none" />
          <path className={`${s.leaf} ${s.leafR} ${s.leaf4}`}
            d="M0,-67 C9,-75 17,-78 23,-64" stroke={c.leaf}
            strokeWidth="3.5" strokeLinecap="round" fill="none" />
          {/* ear of corn on some plants */}
          {ear && (
            <g className={s.ear}>
              <ellipse cx="9" cy="-48" rx="5.5" ry="11" fill="#e8c95a"
                stroke="#6a8a3a" strokeWidth="2" transform="rotate(-14 9 -48)" />
            </g>
          )}
          {/* tassel */}
          <g className={s.tassel} stroke="#c9a94b" strokeWidth="3" strokeLinecap="round">
            <path d="M0,-88 L0,-104" />
            <path d="M0,-88 L-8,-100" />
            <path d="M0,-88 L8,-100" />
          </g>
        </g>
      </g>
    </g>
  );
}

const CornFieldBanner = () => (
  <div className={s.banner} aria-hidden="true">
    <svg
      className={s.field}
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sun — kept near center-left so slice-cropping at narrow widths won't cut it */}
      <g className={s.sunGroup}>
        <g className={s.rays} stroke="#f2c14e" strokeWidth="3" strokeLinecap="round" opacity="0.55">
          <path d="M210,6 L210,14" /><path d="M210,70 L210,78" />
          <path d="M174,42 L182,42" /><path d="M238,42 L246,42" />
          <path d="M185,17 L190,22" /><path d="M230,62 L235,67" />
          <path d="M235,17 L230,22" /><path d="M190,62 L185,67" />
        </g>
        <circle className={s.sun} cx="210" cy="42" r="21" fill="#f2c14e" opacity="0.9" />
      </g>

      {/* drifting clouds */}
      <g className={s.cloud1} fill="#ffffff" opacity="0.55">
        <ellipse cx="0" cy="34" rx="34" ry="12" />
        <ellipse cx="26" cy="28" rx="24" ry="10" />
      </g>
      <g className={s.cloud2} fill="#ffffff" opacity="0.4">
        <ellipse cx="0" cy="62" rx="28" ry="10" />
        <ellipse cx="-22" cy="57" rx="18" ry="8" />
      </g>

      {/* the corn field — back row first so the front row overlaps it */}
      {BACK_ROW.map((p, i) => <CornPlant key={`b${i}`} {...p} />)}
      {FRONT_ROW.map((p, i) => <CornPlant key={`f${i}`} {...p} />)}

      {/* soil */}
      <rect x="0" y="148" width="1200" height="22" fill="#7a5c3a" />
      <rect x="0" y="148" width="1200" height="3" fill="#5f4629" />
    </svg>

    <div className={s.tagline}>
      From planting to harvest — data for every stage.
    </div>
  </div>
);

export default CornFieldBanner;
