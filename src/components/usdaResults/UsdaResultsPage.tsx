'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { api, UsdaResults, ResultsRankRow, ResultsIndividual } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Commodity { key: string; label: string; icon: string; }

const COMMODITIES: Commodity[] = [
  { key: 'CORN',     label: 'Corn',     icon: '🌽' },
  { key: 'SOYBEANS', label: 'Soybeans', icon: '🫘' },
  { key: 'WHEAT',    label: 'Wheat',    icon: '🌾' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

/** "AUG" → "Aug forecast", "YEAR" → "final". */
function periodLabel(p: string): string {
  if (!p || p === '—') return '';
  if (p === 'YEAR') return 'final number';
  const m: Record<string, string> = {
    MAY: 'May', JUN: 'Jun', JUL: 'Jul', AUG: 'Aug',
    SEP: 'Sep', OCT: 'Oct', NOV: 'Nov', DEC: 'Dec',
  };
  return `${m[p] ?? p} forecast`;
}

function formatCutoff(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Reveal plumbing ──────────────────────────────────────────────
   A one-shot IntersectionObserver hook. Each board stays hidden until
   it's scrolled ~15% into view, then it (and its rows) animate in. */
function useInView<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { setInView(true); io.disconnect(); }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

/** requestAnimationFrame count-up; starts when `run` flips true. */
function useCountUp(target: number | null, run: boolean, durationMs = 1100): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run || target == null) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);   // easeOutCubic
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, durationMs]);
  return val;
}

/**
 * /usda-results — leaderboards scoring the community's yield guesses against
 * USDA's actual national number, revealed as a slow "awards ceremony" the user
 * scrolls through rather than a wall of tables on load.
 */
export default function UsdaResultsPage() {
  const [commodity, setCommodity] = useState<Commodity>(COMMODITIES[0]);
  const [period, setPeriod]   = useState<string | undefined>(undefined);
  const [data, setData]       = useState<UsdaResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getUsdaResults(commodity.key, period)
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Could not load results. Is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [commodity, period]);

  return (
    <div className={styles.page}>
      <style>{REVEAL_CSS}</style>

      {/* Hero — always visible */}
      <div style={{
        background: 'linear-gradient(135deg, #2c4a1e 0%, #3d6b2a 55%, #2c4a1e 100%)',
        border: '1px solid #1a2e0f', borderRadius: 8, padding: '1.5rem 1.75rem',
        marginBottom: '1.25rem', color: '#f0f7e6',
      }}>
        <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.7rem', margin: '0 0 .35rem' }}>
          🏅 USDA Yield Challenge — Results
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.9rem', color: '#d8ecc0', margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
          The standings, revealed one board at a time — scroll down to count down to the sharpest guess.{' '}
          <Link href="/usda-challenge" style={{ color: '#a8cc78', fontWeight: 700 }}>
            Haven&apos;t guessed yet? →
          </Link>
        </p>
      </div>

      {/* Commodity selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.75rem' }}>
        {COMMODITIES.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => { setCommodity(c); setPeriod(undefined); }}
            className={`${styles.filterPill} ${commodity.key === c.key ? styles.filterPillActive : ''}`}
            style={{ fontWeight: 700, fontSize: '.95rem', padding: '.5rem 1rem' }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Report-period selector (only when more than one report is published) */}
      {data && data.usdaYield != null && data.availablePeriods.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.1rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#6a7a55', marginRight: '.2rem' }}>
            Report:
          </span>
          {data.availablePeriods.map(p => (
            <button
              key={p.period}
              type="button"
              onClick={() => setPeriod(p.period)}
              className={`${styles.filterPill} ${data.period === p.period ? styles.filterPillActive : ''}`}
              style={{ fontSize: '.8rem', padding: '.3rem .7rem' }}
            >
              {periodLabel(p.period) || p.period}
            </button>
          ))}
        </div>
      )}

      {loading && <p className={styles.loading}>Loading results…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && data && (
        data.usdaYield == null ? (
          <p className={styles.empty}>
            {data.message ?? 'USDA national yield not available yet.'}
          </p>
        ) : (
          /* key forces the whole ceremony to replay when commodity/period changes */
          <div key={`${commodity.key}-${data.period}`}>
            <Headline
              label={commodity.label}
              year={data.year}
              usdaYield={data.usdaYield}
              participants={data.participants}
              period={data.period}
              cutoff={data.cutoff}
            />

            {data.participants === 0 ? (
              <p className={styles.empty}>
                No eligible guesses for the {periodLabel(data.period) || data.period} yet — be the first on the{' '}
                <Link href="/usda-challenge" style={{ color: '#3d6b2a', fontWeight: 700 }}>Yield Challenge</Link>.
              </p>
            ) : (
              <>
                <ScrollCue />
                <RankBoard
                  title="🏆 By Group"
                  firstColHeader="Group"
                  rows={data.byGroup}
                />
                <RankBoard
                  title="📍 By State"
                  firstColHeader="State"
                  rows={data.byState}
                />
                <IndividualsBoard rows={data.topIndividuals} usdaYield={data.usdaYield} />
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* ── USDA headline with count-up ─────────────────────────────────── */
function Headline({
  label, year, usdaYield, participants, period, cutoff,
}: {
  label: string; year: number; usdaYield: number; participants: number;
  period: string; cutoff: string | null;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const yieldVal = useCountUp(usdaYield, inView, 1300);
  const partVal  = useCountUp(participants, inView, 1000);
  const cutoffStr = formatCutoff(cutoff);

  return (
    <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''}`} style={{ marginBottom: '2.5rem' }}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🎯</span>
          <h2>USDA Actual — {label} {year}</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'baseline', padding: '1.1rem 1.25rem', fontFamily: 'Lato, sans-serif' }}>
          <span>
            <strong style={{ color: '#2c4a1e', fontSize: '2.4rem', fontVariantNumeric: 'tabular-nums' }}>
              {yieldVal.toFixed(1)}
            </strong>
            <span style={{ color: '#888', fontSize: '.8rem', marginLeft: '.4rem' }}>bu/acre</span>
            {periodLabel(period) && (
              <span style={{ color: '#6a7a55', fontSize: '.78rem', marginLeft: '.6rem' }}>
                ({periodLabel(period)})
              </span>
            )}
          </span>
          <span style={{ color: '#555' }}>
            <strong style={{ color: '#2c4a1e', fontSize: '1.4rem', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(partVal)}
            </strong>
            <span style={{ color: '#888', fontSize: '.8rem', marginLeft: '.35rem' }}>
              eligible participant{participants === 1 ? '' : 's'}
            </span>
          </span>
        </div>
        {cutoffStr && (
          <div style={{
            padding: '.55rem 1.25rem', borderTop: '1px dashed #d8e3c8',
            fontFamily: 'Lato, sans-serif', fontSize: '.74rem', color: '#7a8a65',
          }}>
            🔒 Cheat-proof: only guesses locked in before USDA published this report ({cutoffStr}) are counted.
          </div>
        )}
      </div>
    </div>
  );
}

/** Bouncing "scroll down" cue between the headline and the first board. */
function ScrollCue() {
  return (
    <div style={{ textAlign: 'center', margin: '0 0 1.75rem' }}>
      <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase', color: '#8aa06a' }}>
        Scroll to reveal the standings
      </div>
      <div className="scroll-cue" style={{ fontSize: '1.4rem', color: '#8fbc45', lineHeight: 1 }}>↓</div>
    </div>
  );
}

/* ── Ranked group/state board ────────────────────────────────────── */
function RankBoard({
  title, firstColHeader, rows,
}: {
  title: string; firstColHeader: string; rows: ResultsRankRow[];
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''}`} style={{ marginBottom: '3rem' }}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>{title.split(' ')[0]}</span>
          <h2>{title.substring(title.indexOf(' ') + 1)}</h2>
        </div>
        <div className={styles.sectionBody}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>{firstColHeader}</th>
                <th>Avg Estimate (bu/acre)</th>
                <th>Avg Miss</th>
                <th>Guesses</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.label}
                  className={`res-row ${inView ? 'res-row-in' : ''} ${i === 0 ? 'winner' : ''}`}
                  style={{ transitionDelay: `${i * 110}ms`, animationDelay: `${i * 110 + 300}ms` }}
                >
                  <td style={{ fontWeight: 700 }}>{MEDALS[i] ?? `#${i + 1}`}</td>
                  <td style={{ fontWeight: 700, color: '#2c4a1e' }}>{r.label}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.avgEstimate.toFixed(1)}</td>
                  <td style={{ fontWeight: 600, color: i === 0 ? '#2c7a1e' : '#555', fontVariantNumeric: 'tabular-nums' }}>
                    ±{r.avgError.toFixed(1)}
                  </td>
                  <td style={{ color: '#888', fontSize: '.82rem' }}>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Top 10 individuals — reverse "countdown to #1" reveal ────────── */
function IndividualsBoard({
  rows, usdaYield,
}: {
  rows: ResultsIndividual[]; usdaYield: number;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const n = rows.length;
  return (
    <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''}`} style={{ marginBottom: '2rem' }}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>👤</span>
          <h2>Top 10 Individuals</h2>
          <span style={{ marginLeft: 'auto', color: '#a8cc78', fontSize: '.75rem', fontFamily: 'Lato, sans-serif' }}>
            counting down to #1 · vs USDA {usdaYield.toFixed(1)}
          </span>
        </div>
        <div className={styles.sectionBody}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>State</th>
                <th>Group</th>
                <th>Estimate</th>
                <th>Miss</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                // reverse stagger: last place reveals first, #1 reveals last
                const delay = (n - 1 - i) * 200;
                return (
                  <tr
                    key={`${r.name}-${i}`}
                    className={`res-row ${inView ? 'res-row-in' : ''} ${i === 0 ? 'winner' : ''}`}
                    style={{ transitionDelay: `${delay}ms`, animationDelay: `${delay + 200}ms` }}
                  >
                    <td style={{ fontWeight: 700 }}>{MEDALS[i] ?? `#${i + 1}`}</td>
                    <td style={{ fontWeight: 700, color: '#2c4a1e' }}>{r.name}</td>
                    <td>{r.state}</td>
                    <td style={{ color: '#666' }}>{r.group}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{r.estimate.toFixed(1)}</td>
                    <td style={{ fontWeight: 600, color: i === 0 ? '#2c7a1e' : '#555', fontVariantNumeric: 'tabular-nums' }}>
                      ±{r.error.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Keyframes + reveal classes, scoped by class names used above. */
const REVEAL_CSS = `
  .reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1);
    will-change: opacity, transform;
  }
  .reveal-in { opacity: 1; transform: none; }

  .res-row {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity .55s ease, transform .55s ease;
  }
  .res-row-in { opacity: 1; transform: none; }

  .res-row.winner.res-row-in {
    animation: winnerGlow 1.6s ease both;
  }
  @keyframes winnerGlow {
    0%   { background: transparent; box-shadow: inset 0 0 0 0 rgba(143,188,69,0); }
    35%  { background: rgba(143,188,69,.38); box-shadow: inset 0 0 0 2px rgba(143,188,69,.55); }
    100% { background: rgba(143,188,69,.16); box-shadow: inset 0 0 0 0 rgba(143,188,69,0); }
  }

  .scroll-cue { animation: bob 1.4s ease-in-out infinite; }
  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(6px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .reveal, .res-row { opacity: 1 !important; transform: none !important; transition: none !important; }
    .res-row.winner.res-row-in { animation: none !important; background: rgba(143,188,69,.16); }
    .scroll-cue { animation: none !important; }
  }
`;
