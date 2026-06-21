'use client';

import { useState } from 'react';
import Link from 'next/link';
import YieldEstimatorPanel from '@/src/components/usdaReports/YieldEstimatorPanel';
import styles from '@/src/styles/farm.module.css';

interface ChallengeCommodity {
  key: string;
  label: string;
  icon: string;
  unit: string;
}

const COMMODITIES: ChallengeCommodity[] = [
  { key: 'CORN',     label: 'Corn',     icon: '🌽', unit: 'bu/acre' },
  { key: 'SOYBEANS', label: 'Soybeans', icon: '🫘', unit: 'bu/acre' },
  { key: 'WHEAT',    label: 'Wheat',    icon: '🌾', unit: 'bu/acre' },
];

/**
 * /usda-challenge — the gamified yield-estimation experience pulled out of
 * the USDA Reports tab and given its own promotable home.
 *
 * Hero pitch → commodity selector → YieldEstimatorPanel (which carries the
 * state-by-state table, the production-weighted national rollup, the
 * "Lock In Your Guess" form, and the community leaderboard).
 */
export default function UsdaChallengePage() {
  const [commodity, setCommodity] = useState<ChallengeCommodity>(COMMODITIES[0]);

  return (
    <div className={styles.page}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #2c4a1e 0%, #3d6b2a 55%, #2c4a1e 100%)',
        border: '1px solid #1a2e0f',
        borderRadius: 8,
        padding: '1.6rem 1.75rem',
        marginBottom: '1.25rem',
        boxShadow: '0 2px 16px rgba(0,0,0,.12)',
        color: '#f0f7e6',
      }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '1.7rem', margin: '0 0 .4rem', letterSpacing: '.02em',
        }}>
          🏆 The USDA Yield Challenge
        </h1>
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '.95rem', lineHeight: 1.6,
          color: '#d8ecc0', margin: '0 0 1rem', maxWidth: 720,
        }}>
          Think you can read the crop better than USDA? Each month NASS publishes its
          state-by-state yield estimates. Tweak the numbers for the states you know,
          lock in your national estimate, and see how you stack up against USDA — and
          against the rest of the community.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
          <Step n="1" title="Tune the states"
            desc="Adjust each state's yield. Your national number recalculates instantly, weighted by harvested acres." />
          <Step n="2" title="Lock in your guess"
            desc="Submit your national estimate with your name and state." />
          <Step n="3" title="Beat the crowd"
            desc="Watch the community average form and see who's closest to USDA." />
        </div>

        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', margin: '1rem 0 0' }}>
          <Link href="/usda-results" style={{ color: '#a8cc78', fontWeight: 700 }}>
            🏅 See the results leaderboards →
          </Link>
        </p>
      </div>

      {/* ── Commodity selector ───────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>
        {COMMODITIES.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCommodity(c)}
            className={`${styles.filterPill} ${commodity.key === c.key ? styles.filterPillActive : ''}`}
            style={{ fontWeight: 700, fontSize: '.95rem', padding: '.5rem 1rem' }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* ── The estimator (table + lock-in + community) ──────── */}
      <YieldEstimatorPanel
        key={commodity.key}     // remount on commodity change so internal state resets
        commodity={commodity.key}
        commodityLabel={commodity.label}
        unit={commodity.unit}
      />
    </div>
  );
}

/** One numbered step in the hero's how-it-works row. */
function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: '.6rem', flex: '1 1 200px', minWidth: 200 }}>
      <span style={{
        flex: '0 0 auto',
        width: 26, height: 26, borderRadius: '50%',
        background: '#8fbc45', color: '#1a2e0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontFamily: 'Lato, sans-serif', fontSize: '.85rem',
      }}>
        {n}
      </span>
      <div style={{ fontFamily: 'Lato, sans-serif' }}>
        <div style={{ fontWeight: 700, color: '#f0f7e6', fontSize: '.88rem' }}>{title}</div>
        <div style={{ color: '#c9dfa3', fontSize: '.78rem', lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}
