'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, EnsoData, EnsoForecastRow } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/* ── ONI scale + colors ───────────────────────────────────────────── */

const DMIN = -2.5, DMAX = 2.5;          // ONI display domain
const EL_NINO = '#dc2626';              // warm
const LA_NINA = '#1d4ed8';              // cool
const NEUTRAL = '#9ca3af';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Color for an ONI value by phase thresholds. */
function oniColor(v: number): string {
  if (v >= 0.5) return EL_NINO;
  if (v <= -0.5) return LA_NINA;
  return NEUTRAL;
}

/** "MAM" 2026 → "MAM 2026". */
function seasonLabel(season: string, year: number): string {
  return `${season} ${year}`;
}

export default function EnsoPage() {
  const [data, setData] = useState<EnsoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const load = useCallback(async () => {
    try {
      setData(await api.getEnso());
    } catch {
      setError('Could not load ENSO data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const current = data?.current ?? null;
  const history = data?.history ?? [];
  const forecast = data?.forecast ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          
          <h2>El Niño / La Niña Tracker</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: '0 0 1rem' }}>
            Where the Pacific sits on the ENSO spectrum, by NOAA&rsquo;s <strong>Oceanic Niño Index (ONI)</strong> —
            the 3-month average sea-surface temperature anomaly in the tropical Pacific. <strong>El Niño</strong>{' '}
            (ONI ≥ +0.5) and <strong>La Niña</strong> (ONI ≤ −0.5) each tilt the odds for U.S. growing-season
            temperature and precipitation.
          </p>

          {loading && <p className={styles.loading}>Loading ENSO data…</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && !error && !current && (
            <p className={styles.empty}>{data?.message ?? 'No ENSO data loaded yet.'}</p>
          )}

          {current && (
            <>
              {/* Current standing */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                background: '#f7faf2', border: '1px solid #e1dccc', borderRadius: 8,
                padding: '.85rem 1.1rem', marginBottom: '1rem',
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: oniColor(current.oni), flex: '0 0 auto',
                }} />
                <div style={{ fontFamily: 'Lato, sans-serif' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1a2e0f', lineHeight: 1.1 }}>
                    {current.label}
                    {current.strength && <span style={{ fontWeight: 600, color: '#555' }}> · {current.strength}</span>}
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#6a7a55' }}>
                    ONI {current.oni > 0 ? '+' : ''}{current.oni.toFixed(2)} °C · {seasonLabel(current.season, current.year)}
                  </div>
                </div>
              </div>

              {/* Spectrum gauge */}
              <SpectrumGauge oni={current.oni} />

              {/* History chart */}
              {history.length > 1 && <HistoryChart data={history} />}
            </>
          )}

          {/* Probabilistic outlook — where it's headed */}
          {forecast.length > 0 && <ForecastBars rows={forecast} issued={data?.forecastIssued ?? null} />}

          {/* Admin: enter / update the outlook (keyed so it re-seeds after a save) */}
          {isAdmin && !loading && (
            <AdminForecastEditor
              key={`${data?.forecastIssued ?? ''}:${forecast.length}`}
              rows={forecast}
              issued={data?.forecastIssued ?? null}
              onSaved={load}
            />
          )}

          {/* What each phase means */}
          <PhaseExplainers phase={current?.phase ?? null} />

          <p style={{ margin: '1rem 0 0', fontSize: '.7rem', color: '#999', fontFamily: 'Lato, sans-serif' }}>
            {data?.source ?? 'NOAA CPC'}{data?.updatedAt ? ` · updated ${new Date(data.updatedAt).toLocaleDateString()}` : ''}.
            Impacts are multi-year tendencies, not a forecast for any single season.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Spectrum gauge (La Niña ← Neutral → El Niño) ──────────────────── */

function SpectrumGauge({ oni }: { oni: number }) {
  const x0 = 45, x1 = 555, W = x1 - x0, barY = 46, barH = 24;
  const gx = (v: number) => x0 + ((clamp(v, DMIN, DMAX) - DMIN) / (DMAX - DMIN)) * W;
  const px = gx(oni);

  return (
    <svg viewBox="0 0 600 118" style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
         aria-label={`ONI gauge at ${oni.toFixed(2)}`}>
      <defs>
        <linearGradient id="ensoScale" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#1d4ed8" />
          <stop offset="40%"  stopColor="#cbd5e1" />
          <stop offset="50%"  stopColor="#f1f5f1" />
          <stop offset="60%"  stopColor="#fecaca" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>

      <rect x={x0} y={barY} width={W} height={barH} rx="6" fill="url(#ensoScale)" stroke="#cdd6bd" />

      {/* Threshold ticks at ±0.5 (edges of the Neutral band) */}
      {[-0.5, 0.5].map(t => (
        <line key={t} x1={gx(t)} y1={barY - 4} x2={gx(t)} y2={barY + barH + 4} stroke="#6a7a55" strokeWidth="1" strokeDasharray="3 2" />
      ))}

      {/* Zone labels */}
      <text x={gx(-1.5)} y={barY + barH + 22} textAnchor="middle" fontSize="13" fontFamily="Lato, sans-serif" fill="#1d4ed8" fontWeight="700">La Niña</text>
      <text x={gx(0)}    y={barY + barH + 22} textAnchor="middle" fontSize="13" fontFamily="Lato, sans-serif" fill="#6a7a55" fontWeight="700">Neutral</text>
      <text x={gx(1.5)}  y={barY + barH + 22} textAnchor="middle" fontSize="13" fontFamily="Lato, sans-serif" fill="#dc2626" fontWeight="700">El Niño</text>

      {/* End scale labels */}
      <text x={x0} y={barY - 8} textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="Lato, sans-serif">−2.5</text>
      <text x={x1} y={barY - 8} textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="Lato, sans-serif">+2.5</text>

      {/* Pointer */}
      <polygon points={`${px - 7},${barY - 6} ${px + 7},${barY - 6} ${px},${barY + 4}`} fill="#1a2e0f" />
      <line x1={px} y1={barY} x2={px} y2={barY + barH} stroke="#1a2e0f" strokeWidth="2" />
      <text x={clamp(px, x0 + 14, x1 - 14)} y={barY + barH + 38} textAnchor="middle" fontSize="12" fontWeight="800"
            fontFamily="Lato, sans-serif" fill="#1a2e0f">
        {oni > 0 ? '+' : ''}{oni.toFixed(2)}
      </text>
    </svg>
  );
}

/* ── History chart (recent seasons) ────────────────────────────────── */

function HistoryChart({ data }: { data: { season: string; year: number; oni: number }[] }) {
  const W = 600, H = 170, padL = 28, padR = 8, padT = 10, padB = 22;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const yScale = (v: number) => padT + ((DMAX - clamp(v, DMIN, DMAX)) / (DMAX - DMIN)) * plotH;
  const zeroY = yScale(0);
  const bw = plotW / data.length;

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <h4 style={{
        fontFamily: 'Lato, sans-serif', fontSize: '.7rem', color: '#6a7a55',
        textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 .35rem',
      }}>
        ONI history · last {Math.round(data.length / 12)} years
      </h4>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="ONI history">
        {/* Gridlines + y labels at key thresholds */}
        {[2, 1, 0.5, 0, -0.5, -1, -2].map(g => (
          <g key={g}>
            <line x1={padL} y1={yScale(g)} x2={W - padR} y2={yScale(g)}
                  stroke={g === 0 ? '#bbb' : Math.abs(g) === 0.5 ? '#cdd6bd' : '#eee'}
                  strokeWidth="1" strokeDasharray={Math.abs(g) === 0.5 ? '4 3' : undefined} />
            <text x={padL - 4} y={yScale(g) + 3} textAnchor="end" fontSize="8" fill="#aaa" fontFamily="Lato, sans-serif">
              {g > 0 ? '+' : ''}{g}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const x = padL + i * bw;
          const top = d.oni >= 0 ? yScale(d.oni) : zeroY;
          const h = Math.abs(yScale(d.oni) - zeroY);
          return (
            <rect key={`${d.season}-${d.year}`} x={x + bw * 0.1} y={top} width={bw * 0.8} height={Math.max(0.5, h)}
                  fill={oniColor(d.oni)} opacity={Math.abs(d.oni) < 0.5 ? 0.55 : 0.9}>
              <title>{seasonLabel(d.season, d.year)}: ONI {d.oni > 0 ? '+' : ''}{d.oni.toFixed(2)}</title>
            </rect>
          );
        })}

        {/* X labels — one per year, at the DJF season */}
        {data.map((d, i) => {
          if (d.season !== 'DJF') return null;
          const x = padL + i * bw + bw / 2;
          return (
            <text key={`yr-${d.year}`} x={x} y={H - 6} textAnchor="middle" fontSize="8" fill="#888" fontFamily="Lato, sans-serif">
              {d.year}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Probabilistic outlook (admin-entered) ─────────────────────────── */

function ForecastBars({ rows, issued }: { rows: EnsoForecastRow[]; issued: string | null }) {
  const seg = (pct: number, color: string) =>
    pct > 0 ? (
      <div style={{
        width: `${pct}%`, background: color, color: '#fff', fontSize: '.62rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {pct >= 12 ? `${Math.round(pct)}%` : ''}
      </div>
    ) : null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h4 style={{
        fontFamily: 'Lato, sans-serif', fontSize: '.7rem', color: '#6a7a55',
        textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 .15rem',
      }}>
        Outlook · odds for coming seasons
      </h4>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.72rem', color: '#888', margin: '0 0 .6rem' }}>
        Official CPC/IRI probabilities{issued ? ` · issued ${issued}` : ''}.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {rows.map(r => (
          <div key={r.id ?? r.season} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <span style={{
              flex: '0 0 78px', fontFamily: 'Lato, sans-serif', fontSize: '.78rem',
              fontWeight: 700, color: '#2c4a1e',
            }}>
              {r.season}
            </span>
            <div style={{
              flex: 1, display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden',
              border: '1px solid #e1dccc', background: '#f4f0e8',
            }}>
              {seg(r.laNina, LA_NINA)}
              {seg(r.neutral, NEUTRAL)}
              {seg(r.elNino, EL_NINO)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '.55rem', fontFamily: 'Lato, sans-serif', fontSize: '.72rem', color: '#555' }}>
        <LegendDot color={LA_NINA} label="La Niña" />
        <LegendDot color={NEUTRAL} label="Neutral" />
        <LegendDot color={EL_NINO} label="El Niño" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
      <span style={{ width: 11, height: 11, borderRadius: 2, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/** Parse the admin textarea: one line per season — "Season, elNino, neutral, laNina". */
function parseRows(text: string): { season: string; elNino: number; neutral: number; laNina: number }[] {
  const out: { season: string; elNino: number; neutral: number; laNina: number }[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 4) continue;
    const [season, en, ne, ln] = parts;
    const elNino = parseFloat(en), neutral = parseFloat(ne), laNina = parseFloat(ln);
    if (!season || [elNino, neutral, laNina].some(n => isNaN(n))) continue;
    out.push({ season, elNino, neutral, laNina });
  }
  return out;
}

function AdminForecastEditor({
  rows, issued, onSaved,
}: { rows: EnsoForecastRow[]; issued: string | null; onSaved: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [issuedInput, setIssuedInput] = useState(issued ?? '');
  const [text, setText] = useState(
    rows.map(r => `${r.season}, ${r.elNino}, ${r.neutral}, ${r.laNina}`).join('\n'),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const parsed = parseRows(text);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await api.saveEnsoForecast({ issued: issuedInput.trim(), rows: parsed });
      setMsg({ ok: true, text: `Saved ${parsed.length} season${parsed.length !== 1 ? 's' : ''}.` });
      await onSaved();
    } catch {
      setMsg({ ok: false, text: 'Save failed — check that you are signed in as an admin.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginTop: '1.25rem', borderTop: '1px dashed #d8d2c2', paddingTop: '1rem' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'Lato, sans-serif', fontSize: '.78rem', fontWeight: 700, color: '#3d6b2a',
        }}
      >
        {open ? '▾' : '▸'} Admin · update the outlook
      </button>

      {open && (
        <div style={{ marginTop: '.7rem', fontFamily: 'Lato, sans-serif' }}>
          <p style={{ fontSize: '.74rem', color: '#666', margin: '0 0 .5rem', lineHeight: 1.45 }}>
            Paste CPC/IRI probabilities, one season per line as{' '}
            <code style={{ background: '#f4f0e8', padding: '0 .25rem', borderRadius: 3 }}>
              Season, El Niño %, Neutral %, La Niña %
            </code>{' '}
            — e.g. <code style={{ background: '#f4f0e8', padding: '0 .25rem', borderRadius: 3 }}>JJA 2026, 55, 43, 2</code>. Each row should total ~100%.
          </p>

          <label style={{ display: 'block', fontSize: '.72rem', color: '#555', marginBottom: '.5rem' }}>
            Issued
            <input
              value={issuedInput}
              onChange={e => setIssuedInput(e.target.value)}
              placeholder="June 2026"
              style={{
                display: 'block', marginTop: '.2rem', width: 180, padding: '.4rem .55rem',
                border: '1px solid #cdd6bd', borderRadius: 4, fontSize: '.82rem',
              }}
            />
          </label>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={'JJA 2026, 55, 43, 2\nJAS 2026, 60, 38, 2\nASO 2026, 62, 36, 2'}
            style={{
              width: '100%', padding: '.6rem .7rem', border: '1px solid #cdd6bd', borderRadius: 4,
              fontFamily: 'monospace', fontSize: '.8rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />

          {/* Live preview */}
          {parsed.length > 0 && (
            <div style={{ marginTop: '.7rem' }}>
              <ForecastBars rows={parsed.map(p => ({ ...p }))} issued={issuedInput.trim() || null} />
            </div>
          )}

          {msg && (
            <p style={{
              margin: '.6rem 0 0', fontSize: '.8rem',
              color: msg.ok ? '#27ae60' : '#c0392b', fontWeight: 700,
            }}>
              {msg.text}
            </p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving || parsed.length === 0}
            className={styles.btn}
            style={{ marginTop: '.7rem' }}
          >
            {saving ? 'Saving…' : `Save outlook (${parsed.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Phase explanations ────────────────────────────────────────────── */

function PhaseExplainers({ phase }: { phase: string | null }) {
  const cards = [
    {
      key: 'EL_NINO',
      title: '🔴 El Niño (warm)',
      color: EL_NINO,
      body: 'The tropical Pacific warms. U.S. winters tend to run wetter and cooler across the southern tier ' +
            '(Southern Plains, Gulf, Southeast) and milder, drier across the northern Corn Belt and Plains. ' +
            'Often eases Southern Plains / Southwest drought — favorable for winter wheat — and tends toward a ' +
            'quieter Atlantic hurricane season.',
    },
    {
      key: 'LA_NINA',
      title: '🔵 La Niña (cool)',
      color: LA_NINA,
      body: 'The tropical Pacific cools. U.S. winters tend to run drier and warmer across the south — raising ' +
            'drought risk in the Southern Plains and Southwest (stress for winter wheat) — and wetter, cooler ' +
            'across the northern Corn Belt, Great Lakes, and Pacific Northwest. Tends toward a more active ' +
            'Atlantic hurricane season.',
    },
    {
      key: 'NEUTRAL',
      title: '⚪ Neutral',
      color: NEUTRAL,
      body: 'No strong Pacific signal. ENSO provides little seasonal steering, so outlooks lean on other ' +
            'climate drivers and generally carry lower confidence.',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.75rem', marginTop: '1.25rem' }}>
      {cards.map(c => {
        const active = phase === c.key;
        return (
          <div key={c.key} style={{
            border: `1px solid ${active ? c.color : '#e1dccc'}`,
            borderLeft: `4px solid ${c.color}`,
            background: active ? '#fbfdf7' : '#fff',
            borderRadius: 6, padding: '.7rem .85rem', fontFamily: 'Lato, sans-serif',
            boxShadow: active ? `0 1px 8px ${c.color}22` : undefined,
          }}>
            <div style={{ fontWeight: 800, color: '#1a2e0f', fontSize: '.9rem', marginBottom: '.3rem' }}>
              {c.title}
              {active && (
                <span style={{
                  marginLeft: '.4rem', fontSize: '.6rem', fontWeight: 700, color: '#fff', background: c.color,
                  borderRadius: 10, padding: '.1rem .45rem', verticalAlign: 'middle', textTransform: 'uppercase',
                }}>
                  current
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '.78rem', color: '#555', lineHeight: 1.45 }}>{c.body}</p>
          </div>
        );
      })}
    </div>
  );
}
