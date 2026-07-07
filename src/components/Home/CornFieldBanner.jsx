'use client';
import React from 'react';
import s from './CornFieldBanner.module.css';

/**
 * Decorative animated banner for the home page: a two-row corn field sprouts
 * from the soil (staggered, like a real stand coming in), leaf blades unfurl,
 * tassels and ears fill in, and then the field sways gently in the breeze.
 *
 * Pure SVG + CSS — no libraries, nothing to load. Users with
 * prefers-reduced-motion just see the fully grown field, no animation.
 *
 * Styling notes: leaves are filled, tapered blades (not strokes), stalks taper
 * toward the tassel, and the palette is muted olive/straw — deliberately more
 * "field at 7pm" than clip art.
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
   dense front row. Each plant: x, base y, size k, lean r, stagger d, tone, ear. */
function makeRow({ seed, count, step, x0, y, kMin, kMax, earEvery, back }) {
  const rnd = mulberry32(seed);
  const plants = [];
  for (let i = 0; i < count; i++) {
    plants.push({
      x: Math.round(x0 + i * step + (rnd() - 0.5) * step * 0.5),
      y,
      k: +(kMin + rnd() * (kMax - kMin)).toFixed(2),
      r: +(rnd() * 5 - 2.5).toFixed(1),
      d: +(rnd() * 1.6).toFixed(2),
      tone: i % 2,
      ear: !back && i % earEvery === 2,
      back,
    });
  }
  return plants;
}

const BACK_ROW  = makeRow({ seed: 7,  count: 20, step: 61, x0: 18, y: 146, kMin: 0.48, kMax: 0.62, earEvery: 99, back: true });
const FRONT_ROW = makeRow({ seed: 21, count: 19, step: 64, x0: 40, y: 150, kMin: 0.84, kMax: 1.08, earEvery: 4,  back: false });

/* Muted, natural greens — two tones so neighbouring plants differ subtly. */
const TONES = [
  { stalk: '#46612e', leafA: '#4c6d33', leafB: '#5c7f40' },
  { stalk: '#4f6c33', leafA: '#567738', leafB: '#678a47' },
];

function CornPlant({ x, y, k, r, d, tone, ear, back }) {
  const c = TONES[tone];
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${k})`} opacity={back ? 0.5 : 1}>
      {/* sway wrapper — rotates around the soil point after growth */}
      <g className={s.sway} style={{ '--d': `${d}s` }}>
        {/* grow wrapper — the whole plant rises out of the ground */}
        <g className={s.grow}>
          {/* stalk — filled and tapered, wider at the soil */}
          <path
            className={s.stalk}
            d="M-2.6,0 C-2.3,-28 -1.7,-58 -1,-88 L1,-88 C1.7,-58 2.3,-28 2.6,0 Z"
            fill={c.stalk}
          />

          {/* leaf blades — filled, tapered shapes that arch out and droop */}
          <path className={`${s.leaf} ${s.leafL} ${s.leaf1}`} fill={c.leafA}
            d="M0,-24 C-13,-33 -27,-38 -36,-34 C-42,-31 -46,-24 -48,-15 C-43,-23 -36,-28 -28,-29 C-18,-30 -8,-27 0,-21 Z" />
          <path className={`${s.leaf} ${s.leafR} ${s.leaf2}`} fill={c.leafB}
            d="M0,-38 C11,-46 23,-51 31,-48 C37,-45 41,-38 43,-30 C38,-37 31,-42 24,-43 C15,-44 7,-41 0,-35 Z" />
          <path className={`${s.leaf} ${s.leafL} ${s.leaf3}`} fill={c.leafB}
            d="M0,-52 C-9,-59 -19,-63 -26,-61 C-31,-59 -35,-53 -37,-46 C-32,-52 -26,-56 -20,-57 C-13,-58 -6,-55 0,-49 Z" />
          <path className={`${s.leaf} ${s.leafR} ${s.leaf4}`} fill={c.leafA}
            d="M0,-62 C8,-68 16,-71 22,-69 C26,-67 29,-62 30,-56 C26,-61 21,-64 16,-65 C10,-66 5,-64 0,-59 Z" />
          <path className={`${s.leaf} ${s.leafL} ${s.leaf5}`} fill={c.leafB}
            d="M0,-72 C-6,-77 -12,-80 -17,-79 C-20,-78 -23,-74 -24,-69 C-21,-73 -17,-75 -13,-76 C-8,-76 -4,-75 0,-70 Z" />

          {/* ear — husked cob with silk, on some front-row plants */}
          {ear && (
            <g className={s.ear}>
              <path d="M6,-38 C4.5,-44 4.5,-52 7,-57 C10,-59 14,-58 15.5,-53 C17,-47 16,-40 13,-36 C10.5,-34 7.5,-35 6,-38 Z"
                fill="#cfae55" />
              <path d="M6,-38 C5,-45 5.5,-52 8,-56 C8,-50 9,-43 12,-37 C10,-35 7.5,-35.5 6,-38 Z"
                fill={c.leafA} />
              <g stroke="#bd8d55" strokeWidth="1.2" strokeLinecap="round" fill="none">
                <path d="M10,-57 C11,-61 13,-63 15,-64" />
                <path d="M9,-57 C8.5,-61 8,-63 8,-66" />
              </g>
            </g>
          )}

          {/* tassel — a fine straw-coloured spray */}
          <g className={s.tassel} stroke="#b9a05e" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M0,-88 C0.5,-96 0,-102 0,-107" />
            <path d="M0,-88 C-3,-95 -6,-99 -10,-102" />
            <path d="M0,-88 C3,-95 6,-99 10,-102" />
            <path d="M0,-88 C-1.5,-95 -3.5,-100 -5,-105" />
            <path d="M0,-88 C1.5,-95 3.5,-100 5,-105" />
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
      <defs>
        {/* soft evening sun — a glow, not a cartoon disc */}
        <radialGradient id="cornSunGlow">
          <stop offset="0%"  stopColor="#fbe7a8" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#f6d98a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f6d98a" stopOpacity="0" />
        </radialGradient>
        {/* low haze that sits behind the back row */}
        <linearGradient id="cornHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#fdf8ec" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="cornSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#77603f" />
          <stop offset="100%" stopColor="#57432a" />
        </linearGradient>
      </defs>

      {/* sun */}
      <circle className={s.sun} cx="210" cy="38" r="36" fill="url(#cornSunGlow)" />
      <circle className={s.sun} cx="210" cy="38" r="11" fill="#f7dd94" opacity="0.85" />

      {/* wispy clouds */}
      <g className={s.cloud1} fill="#ffffff" opacity="0.3">
        <ellipse cx="0" cy="32" rx="46" ry="9" />
        <ellipse cx="32" cy="27" rx="30" ry="7" />
      </g>
      <g className={s.cloud2} fill="#ffffff" opacity="0.22">
        <ellipse cx="0" cy="60" rx="38" ry="7" />
        <ellipse cx="-26" cy="56" rx="22" ry="6" />
      </g>

      {/* horizon haze for depth */}
      <rect x="0" y="112" width="1200" height="38" fill="url(#cornHaze)" />

      {/* the corn field — back row first so the front row overlaps it */}
      {BACK_ROW.map((p, i) => <CornPlant key={`b${i}`} {...p} />)}
      {FRONT_ROW.map((p, i) => <CornPlant key={`f${i}`} {...p} />)}

      {/* soil — gently uneven line, darker at depth */}
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5 L1200,170 L0,170 Z"
        fill="url(#cornSoil)"
      />
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5"
        fill="none" stroke="#46351f" strokeWidth="1.4" opacity="0.5"
      />
    </svg>

    <div className={s.tagline}>
      From planting to harvest — data for every stage.
    </div>
  </div>
);

export default CornFieldBanner;
