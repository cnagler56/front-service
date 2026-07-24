'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import FuturesChart from '@/src/components/commodity/FuturesChart';
import { Markdown } from './Markdown';
import {
  REPORT, BIAS_LABEL, biasTally, allCalls,
  type Bias, type MarketCall, type Sector, type IntelTile,
} from './analysisData';
import s from '@/src/styles/analysis.module.css';

/* ── small shared bits ─────────────────────────────────────────────── */
type Lean = 'bullish' | 'bearish' | undefined;

/** The label is always the explicit call; a lean only tints a neutral pill. */
function Pill({ bias, lean }: { bias: Bias; lean?: Lean }) {
  const leanCls = bias !== 'neutral' ? '' : lean === 'bearish' ? s.leanBearish : lean === 'bullish' ? s.leanBullish : '';
  return (
    <span className={`${s.pill} ${s[bias]} ${leanCls}`}>
      <span className={s.pillDot} />{BIAS_LABEL[bias]}
    </span>
  );
}

const BIAS_HEX: Record<Bias, string> = { buy: '#57b84a', sell: '#e5554b', neutral: '#9fb2c6' };

/** Effective shade for accents: the explicit call, or the lean if only leaning. */
function effShade(bias: Bias, lean?: Lean): Bias {
  if (bias !== 'neutral') return bias;
  if (lean === 'bearish') return 'sell';
  if (lean === 'bullish') return 'buy';
  return 'neutral';
}

/** Build the `--edge` accent custom property as a typed style object. */
const edgeVar = (hex: string): React.CSSProperties => ({ ['--edge']: hex } as React.CSSProperties);

/** Fade-up when scrolled into view. */
function Reveal({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={style} className={`${s.reveal} ${shown ? s.revealed : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}

/* ── overview bento ────────────────────────────────────────────────── */
function Overview() {
  const tally = useMemo(() => biasTally(REPORT), []);
  const total = tally.buy + tally.sell + tally.neutral;
  const calls = allCalls(REPORT);
  const seg = (n: number) => `${(n / total) * 100}%`;

  // strongest signals: pick the highest-conviction sell and buy
  const topSell = calls.find(c => /wheat/i.test(c.label)) ?? calls.find(c => c.bias === 'sell');
  const topBuy = calls.find(c => c.bias === 'buy');

  return (
    <div className={s.bento}>
      <div className={`${s.tile} ${s.spanRead}`}>
        <p className={s.tileLabel}>The Read This Week</p>
        <p className={s.readQuote}>{REPORT.bottomLine}</p>
      </div>

      <div className={`${s.tile} ${s.spanTally}`}>
        <p className={s.tileLabel}>Bias Tally · {total} markets</p>
        <div className={s.tallyBar}>
          <div className={s.tallySeg} style={{ width: seg(tally.sell), background: BIAS_HEX.sell }} />
          <div className={s.tallySeg} style={{ width: seg(tally.neutral), background: BIAS_HEX.neutral }} />
          <div className={s.tallySeg} style={{ width: seg(tally.buy), background: BIAS_HEX.buy }} />
        </div>
        <div className={s.tallyRows}>
          {(['sell', 'neutral', 'buy'] as Bias[]).map(b => (
            <div key={b} className={s.tallyRow}>
              <span className={s.swatch} style={{ background: BIAS_HEX[b] }} />
              <span>{BIAS_LABEL[b]}</span>
              <span className={s.tallyCount}>{tally[b]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${s.tile} ${s.spanSignals}`}>
        <p className={s.tileLabel}>Strongest Signals</p>
        <div className={s.signalStack}>
          {topSell && (
            <div className={s.signalCard} style={{ borderLeftColor: BIAS_HEX.sell }}>
              <h4><Pill bias="sell" /> {topSell.label.replace(/ —.*/, '')}</h4>
              <p>{topSell.headline}</p>
            </div>
          )}
          {topBuy && (
            <div className={s.signalCard} style={{ borderLeftColor: BIAS_HEX.buy }}>
              <h4><Pill bias="buy" /> {topBuy.label}</h4>
              <p>{topBuy.headline}</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${s.tile} ${s.spanBoard}`}>
        <p className={s.tileLabel}>Market Bias Board</p>
        <div className={s.board}>
          {calls.map(c => (
            <div key={c.label} className={s.chip}>
              <Pill bias={c.bias} lean={c.lean} />
              <div className={s.chipBody}>
                <div className={s.chipName}>{c.label}</div>
                <div className={s.chipNote}>{c.headline}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── market card (with chart) / note (without) ─────────────────────── */
function Levels({ call }: { call: MarketCall }) {
  if (!call.levels?.length) return null;
  return (
    <div className={s.levels}>
      {call.levels.map(l => (
        <div key={l.label} className={s.level}>
          <span className={s.levelLabel}>{l.label}</span>
          <span className={s.levelValue}>{l.value}</span>
        </div>
      ))}
    </div>
  );
}

function MarketBlock({ call }: { call: MarketCall }) {
  const edge = BIAS_HEX[effShade(call.bias, call.lean)];
  if (call.chartKey) {
    return (
      <Reveal className={s.card}>
        <div className={s.cardHead}>
          <h3 className={s.cardTitle}>{call.label}</h3>
          <Pill bias={call.bias} lean={call.lean} />
          <Levels call={call} />
          <p className={s.cardHeadline}>{call.headline}</p>
        </div>
        <div className={s.chartWrap}>
          <FuturesChart commodity={call.chartKey} commodityLabel={call.label.replace(/ —.*/, '')} />
        </div>
        <div className={s.commentary} style={edgeVar(edge)}>
          <div className={s.commentaryInner}><Markdown text={call.commentary} /></div>
        </div>
      </Reveal>
    );
  }
  return (
    <Reveal className={s.note} style={edgeVar(edge)}>
      <div className={s.noteHead}>
        <h3 className={s.noteTitle}>{call.label}</h3>
        <Pill bias={call.bias} lean={call.lean} />
        <Levels call={call} />
      </div>
      <Markdown text={call.commentary} />
    </Reveal>
  );
}

function SectorView({ sector }: { sector: Sector }) {
  const hasCharts = sector.markets.some(m => m.chartKey);
  const notes = sector.markets.filter(m => !m.chartKey);
  const charts = sector.markets.filter(m => m.chartKey);
  return (
    <section id={sector.id} className={s.sector}>
      <div className={s.sectorHead}>
        <h2 className={s.sectorTitle}>{sector.name}</h2>
        <p className={s.sectorBlurb}>{sector.blurb}</p>
      </div>
      {charts.map(m => <MarketBlock key={m.label} call={m} />)}
      {notes.length > 0 && (
        <div className={hasCharts ? '' : s.noteGrid}>
          {notes.map(m => <MarketBlock key={m.label} call={m} />)}
        </div>
      )}
    </section>
  );
}

/* ── intel tiles ───────────────────────────────────────────────────── */
function IntelView({ tile }: { tile: IntelTile }) {
  const isBig = tile.id === 'bigpicture';
  const cls =
    tile.id === 'weather' ? s.intelWeather :
    tile.id === 'logistics' ? s.intelLogistics : s.intelBig;
  return (
    <Reveal className={`${s.intelTile} ${cls}`}>
      <div className={s.intelHead}>
        <span className={s.intelIcon}>{tile.icon}</span>
        <h3 className={s.intelTitle}>{tile.title}</h3>
      </div>
      <div className={s.mdLight}><Markdown text={tile.body} dark={isBig} /></div>
    </Reveal>
  );
}

/* ── sticky section nav ────────────────────────────────────────────── */
function SectionNav() {
  const links = [
    { id: 'overview', label: 'Overview' },
    ...REPORT.sectors.map(sec => ({ id: sec.id, label: sec.name })),
    { id: 'intel', label: 'Intel' },
  ];
  const [active, setActive] = useState('overview');
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(l => { const el = document.getElementById(l.id); if (el) io.observe(el); });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <nav className={s.nav}>
      <div className={s.navInner}>
        {links.map(l => (
          <a key={l.id} href={`#${l.id}`}
            className={`${s.navLink} ${active === l.id ? s.navLinkActive : ''}`}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */
export default function AnalysisPage() {
  const { user } = useUser();
  const [state, setState] = useState<'loading' | 'ok' | 'gated'>('loading');

  useEffect(() => {
    let live = true;
    api.getAnalysisAccess()
      .then(a => { if (live) setState(a.canRead ? 'ok' : 'gated'); })
      .catch(() => { if (live) setState('gated'); });
    return () => { live = false; };
  }, [user]);

  return (
    <div className={s.root}>
      <header className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.kicker}><span className={s.pulse} /> {REPORT.edition}</span>
          <h1 className={s.title}>{REPORT.title}</h1>
          <div className={s.metaRow}>
            <span><strong>{REPORT.author}</strong></span>
            <span className={s.metaDot} />
            <span>{REPORT.date}</span>
            <span className={s.metaDot} />
            <span>Subscriber edition</span>
          </div>
          {state === 'ok' && <Overview />}
          {state === 'loading' && <p style={{ color: '#aebfa0' }}>Loading analysis…</p>}
          {state === 'gated' && (
            <div className={s.stateWrap}>
              <h2>Subscriber Content</h2>
              <p>
                This analysis is available to the provider&rsquo;s subscribers.{' '}
                {user
                  ? <>Your account (<strong style={{ color: '#c7e6a0' }}>{user.email}</strong>) isn&rsquo;t on the list yet — ask the provider to add this email.</>
                  : <><Link href="/signin">Sign in</Link> with the email your provider has on file to view it.</>}
              </p>
            </div>
          )}
        </div>
      </header>

      {state === 'ok' && (
        <>
          <SectionNav />
          <main className={s.content}>
            {REPORT.sectors.map(sec => <SectorView key={sec.id} sector={sec} />)}
            <section id="intel" className={s.sector}>
              <div className={s.sectorHead}>
                <h2 className={s.sectorTitle}>Situational Intel</h2>
                <p className={s.sectorBlurb}>Weather, logistics and the structural backdrop shaping price.</p>
              </div>
              <div className={s.intel}>
                {REPORT.intel.map(t => <IntelView key={t.id} tile={t} />)}
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
