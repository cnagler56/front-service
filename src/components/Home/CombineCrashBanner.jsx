'use client';
import React from 'react';
import s from './CombineCrashBanner.module.css';

/**
 * Animated home-page banner: harvest drama in five acts.
 *
 *   1. (0s)    A corn field grows in.
 *   2. (1s)    A green combine rolls in from the left, cutting corn to
 *              stubble as its header passes.
 *   3. (4.8s)  A red combine comes flying in from the right, flattening
 *              corn at high speed…
 *   4. (5.5s)  …and crashes head-on into the green one. Sparks, a jolt,
 *              a screen shake — and a fire starts at the crash point.
 *   5. (7.5s)  Both combines explode: flash, fireball, shockwave, flying
 *              debris. The blast levels the nearby corn. What's left
 *              smolders forever (flames flicker + smoke loops).
 *
 * Pure SVG + CSS like the other banners. prefers-reduced-motion users see
 * the calm pre-crash field — no combines, no explosion (the drama is
 * animation-only; every disaster element starts invisible).
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

/* ── Timeline (seconds) — keep in sync with the .module.css delays ── */
const T_C1_START = 1.0;   // green combine enters
const T_C1_ARRIVE = 4.6;  // green combine reaches centre
const T_CRASH = 5.5;      // impact
const T_BOOM = 7.5;       // explosion
const C1_SPEED = (520 + 150) / (T_C1_ARRIVE - T_C1_START); // units/sec
const C2_HEADER_FROM = 1332, C2_HEADER_TO = 598;           // red header sweep
const C2_SPEED = (C2_HEADER_FROM - C2_HEADER_TO) / 0.7;

/* Corn rows. Front-row plants know their fate:
   cut   — green combine's header reaches them (timed to its drive)
   mow   — red combine flattens them on the way in
   blast — inside the explosion radius, vanish at T_BOOM  */
const rnd = mulberry32(5);
const FRONT_CORN = Array.from({ length: 14 }, (_, i) => {
  const x = Math.round(60 + i * 77 + (rnd() - 0.5) * 30);
  const cut = x < 560 ? +(T_C1_START + (x + 150 - 68) / C1_SPEED).toFixed(2) : null;
  const mow = x > 680 ? +(4.8 + (C2_HEADER_FROM - x) / C2_SPEED).toFixed(2) : null;
  return {
    x,
    k: +(0.85 + rnd() * 0.25).toFixed(2),
    d: +(rnd() * 0.6).toFixed(2),
    tone: i % 2,
    cut, mow,
    blast: x > 460 && x < 840,
  };
});
const BACK_CORN = Array.from({ length: 11 }, (_, i) => ({
  x: Math.round(30 + i * 112 + (rnd() - 0.5) * 40),
  k: +(0.5 + rnd() * 0.14).toFixed(2),
  d: +(rnd() * 0.6).toFixed(2),
  tone: i % 2,
}));

const TONES = [
  { stalk: '#46612e', leaf: '#4c6d33' },
  { stalk: '#4f6c33', leaf: '#5c7f40' },
];

function Corn({ x, k, d, tone, cut, mow, blast, back }) {
  const c = TONES[tone];
  let fateClass = '';
  let fateStyle = {};
  if (cut != null) { fateClass = s.cut; fateStyle = { '--ct': `${cut}s` }; }
  else if (mow != null) { fateClass = s.mow; fateStyle = { '--ct': `${mow}s` }; }
  return (
    <g transform={`translate(${x},150) scale(${k})`} opacity={back ? 0.45 : 1}>
      <g className={blast ? s.blast : undefined}>
        <g className={fateClass || undefined} style={fateStyle}>
          <g className={s.grow} style={{ '--d': `${d}s` }}>
            <path d="M0,0 C1,-24 -1,-46 0,-66" stroke={c.stalk} strokeWidth="4"
              strokeLinecap="round" fill="none" />
            <path fill={c.leaf} d="M0,-20 C-10,-27 -21,-31 -28,-27 C-33,-24 -36,-18 -38,-11 C-33,-18 -27,-22 -21,-23 C-13,-24 -6,-22 0,-17 Z" />
            <path fill={c.leaf} d="M0,-32 C9,-39 19,-43 25,-40 C29,-37 32,-31 33,-25 C29,-31 24,-34 19,-35 C12,-36 6,-34 0,-29 Z" />
            <path fill={c.leaf} d="M0,-46 C-7,-52 -14,-55 -19,-53 C-22,-51 -25,-46 -26,-41 C-22,-46 -18,-48 -14,-49 C-9,-50 -4,-48 0,-43 Z" />
            <g stroke="#b9a05e" strokeWidth="1.4" strokeLinecap="round" fill="none">
              <path d="M0,-66 C0,-72 0,-76 0,-80" />
              <path d="M0,-66 C-2,-71 -4,-74 -6,-76" />
              <path d="M0,-66 C2,-71 4,-74 6,-76" />
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

/* A side-view combine, facing right. body/accent pick the brand colours. */
function Combine({ body, accent }) {
  return (
    <g>
      {/* header + reel */}
      <path d="M34,-2 L78,-2 L78,-14 L40,-22 Z" fill="#3b3b33" />
      <g stroke={accent} strokeWidth="1.6" opacity="0.9">
        <path d="M42,-18 L74,-11" />
        <path d="M41,-13 L75,-7" />
        <path d="M40,-8 L76,-4" />
      </g>
      {/* body */}
      <path d="M-48,-20 L-48,-52 L4,-52 L16,-34 L34,-30 L34,-20 Z" fill={body} />
      <rect x="-48" y="-30" width="82" height="5" fill={accent} />
      {/* grain tank + auger + exhaust */}
      <rect x="-44" y="-64" width="40" height="13" rx="2" fill={body} />
      <rect x="-44" y="-55" width="40" height="3" fill={accent} />
      <path d="M-40,-58 L-66,-40" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <rect x="-8" y="-78" width="4" height="15" fill="#44443c" />
      {/* cab */}
      <rect x="4" y="-70" width="27" height="22" rx="2" fill={body} />
      <rect x="8" y="-66" width="19" height="13" rx="1" fill="#bcd8e8" />
      {/* wheels */}
      <g className={s.wheelR}>
        <circle cx="-28" cy="-14" r="14" fill="#26261f" />
        <circle cx="-28" cy="-14" r="6" fill={accent} />
        <path d="M-28,-26 L-28,-2 M-40,-14 L-16,-14" stroke="#26261f" strokeWidth="3" />
        <path d="M-28,-25 L-28,-3" stroke={accent} strokeWidth="1.6" />
      </g>
      <g className={s.wheelF}>
        <circle cx="24" cy="-9" r="9" fill="#26261f" />
        <circle cx="24" cy="-9" r="4" fill={accent} />
        <path d="M24,-16.5 L24,-1.5" stroke={accent} strokeWidth="1.4" />
      </g>
    </g>
  );
}

/* Debris chunk fired from the crash point; trajectory via CSS vars. */
function Debris({ cls, dx, dy, w = 6, h = 4, fill }) {
  return (
    <rect className={cls} x={-w / 2} y={-h / 2} width={w} height={h} fill={fill}
      style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }} />
  );
}

const CombineCrashBanner = () => (
  <div className={s.banner} aria-hidden="true">
    <svg
      className={`${s.field} ${s.shake}`}
      viewBox="0 0 1200 170"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="crashSunGlow">
          <stop offset="0%" stopColor="#fbe7a8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f6d98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="crashFireball">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="crashSoil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#77603f" />
          <stop offset="100%" stopColor="#57432a" />
        </linearGradient>
      </defs>

      {/* calm sky, one cloud, soft sun — the "before" picture */}
      <circle cx="180" cy="36" r="32" fill="url(#crashSunGlow)" />
      <g className={s.cloud} fill="#ffffff" opacity="0.3">
        <ellipse cx="0" cy="30" rx="44" ry="9" />
        <ellipse cx="30" cy="25" rx="28" ry="7" />
      </g>

      {/* corn */}
      {BACK_CORN.map((p, i) => <Corn key={`b${i}`} {...p} back />)}
      {FRONT_CORN.map((p, i) => <Corn key={`f${i}`} {...p} />)}

      {/* green combine — enters left, harvests to centre */}
      <g transform="translate(520,150)">
        <g className={s.vanish}>
          <g className={s.drive1}>
            <g className={s.jolt1}>
              <Combine body="#3a7d2c" accent="#f2c14e" />
            </g>
          </g>
        </g>
      </g>

      {/* red combine — dashes in from the right (mirrored to face left) */}
      <g transform="translate(666,150) scale(-1,1)">
        <g className={s.vanish}>
          <g className={s.drive2}>
            <g className={s.jolt2}>
              <Combine body="#b03a2e" accent="#f2c14e" />
            </g>
          </g>
        </g>
      </g>

      {/* crash sparks + small parts at impact */}
      <g transform="translate(595,132)">
        <g className={s.sparks} stroke="#fde68a" strokeWidth="2" strokeLinecap="round">
          <path d="M-6,-6 L-16,-16" /><path d="M6,-8 L14,-18" />
          <path d="M0,-10 L0,-22" /><path d="M-10,0 L-20,-4" /><path d="M10,-2 L20,-8" />
        </g>
        <Debris cls={`${s.deb} ${s.crashDeb}`} dx={-46} dy={-38} fill="#3a7d2c" />
        <Debris cls={`${s.deb} ${s.crashDeb}`} dx={52} dy={-30} fill="#b03a2e" w={5} h={5} />
        <Debris cls={`${s.deb} ${s.crashDeb}`} dx={20} dy={-52} fill="#26261f" w={4} h={3} />
      </g>

      {/* fire at the crash point — grows between crash and boom, then keeps
          burning on the wreckage forever */}
      <g transform="translate(595,148)">
        <g className={s.fireGrow}>
          <path className={s.flame1} fill="#e8842c"
            d="M0,0 C-9,-10 -7,-24 0,-34 C7,-24 9,-10 0,0 Z" />
          <path className={s.flame2} fill="#f6c14e"
            d="M0,0 C-5,-7 -4,-15 0,-21 C4,-15 5,-7 0,0 Z" />
          <path className={s.flame3} fill="#e8842c" transform="translate(-14,0)"
            d="M0,0 C-5,-6 -4,-13 0,-19 C4,-13 5,-6 0,0 Z" />
          <path className={s.flame4} fill="#e8842c" transform="translate(14,0)"
            d="M0,0 C-5,-6 -4,-14 0,-20 C4,-14 5,-6 0,0 Z" />
        </g>
      </g>

      {/* THE EXPLOSION */}
      <g transform="translate(595,118)">
        <circle className={s.shockwave} r="40" fill="none" stroke="#f3a33c" strokeWidth="6" />
        <circle className={s.fireball} r="55" fill="url(#crashFireball)" />
        <circle className={s.flash} r="85" fill="#fff7d9" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={-120} dy={-70} w={9} h={5} fill="#3a7d2c" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={130} dy={-58} w={8} h={6} fill="#b03a2e" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={-70} dy={-92} w={5} h={5} fill="#26261f" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={86} dy={-88} w={6} h={4} fill="#f2c14e" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={-160} dy={-34} w={7} h={4} fill="#b03a2e" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={158} dy={-30} w={7} h={5} fill="#3a7d2c" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={-30} dy={-104} w={4} h={4} fill="#f2c14e" />
        <Debris cls={`${s.deb} ${s.boomDeb}`} dx={40} dy={-100} w={5} h={3} fill="#26261f" />
      </g>

      {/* wreckage — appears the instant the combines vanish */}
      <g className={s.wreck} transform="translate(595,150)">
        <path d="M-70,0 C-66,-16 -50,-24 -34,-20 C-24,-26 -10,-24 -4,-14 L0,0 Z" fill="#33302a" />
        <path d="M2,0 C8,-18 26,-24 40,-18 C52,-22 64,-14 66,0 Z" fill="#3a342c" />
        <circle cx="-44" cy="-6" r="9" fill="none" stroke="#26261f" strokeWidth="4" />
        <circle cx="34" cy="-5" r="7" fill="none" stroke="#26261f" strokeWidth="4" />
        <path d="M-58,-14 L-48,-26 M20,-16 L30,-26" stroke="#26261f" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* smoke — one burst at the boom, then an endless smolder column */}
      <g transform="translate(595,110)" fill="#6b6b64">
        <circle className={`${s.smoke} ${s.smokeA}`} r="14" />
        <circle className={`${s.smoke} ${s.smokeB}`} r="18" />
        <circle className={`${s.smoke} ${s.smokeC}`} r="12" />
      </g>

      {/* soil */}
      <path
        d="M0,150 C150,148.5 300,151 450,149 C650,147.5 850,151 1050,149 C1120,148.5 1170,150.5 1200,149.5 L1200,170 L0,170 Z"
        fill="url(#crashSoil)"
      />

      <text className={s.caption} x="600" y="30" textAnchor="middle"
        fontFamily="Lato, sans-serif" fontSize="13" fontWeight="700"
        letterSpacing="2" fill="#7a4a1e">
        BE CAREFUL OUT THERE THIS HARVEST
      </text>
    </svg>
  </div>
);

export default CombineCrashBanner;
