'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import YieldEstimatorPanel from '@/src/components/usdaReports/YieldEstimatorPanel';
import { api, OpenRound } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface ChallengeCommodity {
  key: string;
  label: string;
  unit: string;
}

const COMMODITIES: ChallengeCommodity[] = [
  { key: 'CORN',     label: 'Corn',     unit: 'bu/acre' },
  { key: 'SOYBEANS', label: 'Soybeans', unit: 'bu/acre' },
  { key: 'WHEAT',    label: 'Wheat',    unit: 'bu/acre' },
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
          The USDA Yield Challenge
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
            desc="Submit your national estimate — and update it anytime new information changes your opinion." />
          <Step n="3" title="Beat the crowd"
            desc="Watch the community average form and see who's closest to USDA." />
        </div>

        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', margin: '1rem 0 0' }}>
          <Link href="/usda-results" style={{ color: '#a8cc78', fontWeight: 700 }}>
            See the results leaderboards →
          </Link>
        </p>
      </div>

      {/* ── Open-round banner (which report you're guessing now) ─ */}
      <RoundBanner />

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
            {c.label}
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

/** "2026-08-12" → "Aug 12, 2026". */
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Tells farmers which Crop Production report their guess counts toward right
 * now. The round is derived from the admin-maintained release dates (next
 * release on/after today), so it rolls July → August → September on its own.
 * Under fresh-per-report scoring, earlier rounds' guesses don't carry forward,
 * so this makes the current round explicit and prompts a re-guess each month.
 */
function RoundBanner() {
  const [round, setRound] = useState<OpenRound | null>(null);

  useEffect(() => {
    api.getOpenRound().then(setRound).catch(() => setRound(null));
  }, []);

  if (!round || !round.scheduled || !round.label) return null;

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem',
      background: '#f0f7e6', border: '1px solid #c9dfa3', borderLeft: '4px solid #8fbc45',
      borderRadius: 6, padding: '.75rem 1rem', marginBottom: '1rem',
      fontFamily: 'Lato, sans-serif',
    }}>
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }} aria-hidden>🌽</span>
      <span style={{ color: '#2c4a1e', fontSize: '.9rem', lineHeight: 1.5 }}>
        <strong>Now guessing: the {round.label} report.</strong>{' '}
        {round.closesOn && <>Lock in or update your estimate before it publishes {fmtDate(round.closesOn)}. </>}
        Each report is scored on its own — last round&rsquo;s guesses don&rsquo;t carry over.
      </span>
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
