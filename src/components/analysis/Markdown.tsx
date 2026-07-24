'use client';

import React from 'react';

/**
 * A compact, dependency-free Markdown renderer for analysis post bodies.
 *
 * It intentionally supports only the subset the analysis reports need — so the
 * analyst can paste lightly-formatted text and get a clean, scannable page:
 *   - #, ##, ### headings
 *   - **bold**, *italic*, `code`, [links](url)
 *   - "- " / "* " bullet lists and "1." ordered lists
 *   - "> " blockquotes (used for the analyst's "from last week" quotes)
 *   - "---" horizontal rules
 *   - GitHub-style pipe tables
 *
 * Special sauce: in a table, cells under a "Bias" / "Stance" / "Environment" /
 * "Signal" column are rendered as colored pills (buy = green, sell = red,
 * neutral = grey) so a "Market Bias Board" table reads at a glance.
 *
 * Everything is built as React elements (no dangerouslySetInnerHTML), so author
 * text can never inject markup.
 */

/* ── Inline formatting ─────────────────────────────────────────────── */
const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${k++}`}>{m[2]}</strong>);
    } else if (m[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${k++}`}>{m[3]}</em>);
    } else if (m[4] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c${k++}`} style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          background: '#f0ece1', padding: '.05rem .3rem', borderRadius: 3, fontSize: '.88em',
        }}>{m[4]}</code>,
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <a key={`${keyPrefix}-a${k++}`} href={m[6]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#3d6b2a', fontWeight: 700 }}>{m[5]}</a>,
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ── Market-bias pills ─────────────────────────────────────────────── */
const BIAS_COL = /^(bias|stance|environment|signal|read|call)$/i;

type BiasKind = 'buy' | 'sell' | 'neutral' | null;

function classifyBias(text: string): BiasKind {
  const t = text.toLowerCase();
  if (/\b(buy|bull|bullish|long|accumulate)\b/.test(t)) return 'buy';
  if (/\b(sell|bear|bearish|short|overbought)\b/.test(t)) return 'sell';
  if (/\b(neutral|sideways|hold|even|flat|steady)\b/.test(t)) return 'neutral';
  return null;
}

const PILL: Record<'buy' | 'sell' | 'neutral', React.CSSProperties> = {
  buy: { background: '#e9f5d8', color: '#33691e', border: '1px solid #b6d97a' },
  sell: { background: '#fdeceb', color: '#b3261e', border: '1px solid #f2b8b3' },
  neutral: { background: '#eef2f7', color: '#46556a', border: '1px solid #c8d2df' },
};

function BiasPill({ kind, label }: { kind: 'buy' | 'sell' | 'neutral'; label: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.03em',
      textTransform: 'uppercase', padding: '.16rem .55rem', borderRadius: 999, ...PILL[kind],
    }}>{label}</span>
  );
}

/* ── Block parsing ─────────────────────────────────────────────────── */
const H = /^(#{1,4})\s+(.*)$/;
const HR = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^>\s?(.*)$/;
const UL = /^\s*[-*]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map(c => c.trim());
}

const headingStyle = (level: number, dark: boolean): React.CSSProperties => ({
  fontFamily: 'Playfair Display, Georgia, serif',
  color: dark ? '#eef4e6' : '#2c4a1e',
  margin: level <= 2 ? '1.4rem 0 .6rem' : '1.1rem 0 .4rem',
  lineHeight: 1.25,
  fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.2rem' : level === 3 ? '1.02rem' : '.92rem',
  borderBottom: level <= 2 ? `1px solid ${dark ? 'rgba(255,255,255,0.14)' : '#e7e1d3'}` : 'none',
  paddingBottom: level <= 2 ? '.3rem' : 0,
});

interface Palette {
  text: string; hr: string; quoteBg: string; quoteBorder: string; quoteText: string;
}

export function Markdown({ text, dark = false }: { text: string; dark?: boolean }) {
  const pal: Palette = dark
    ? { text: '#d7e4c8', hr: 'rgba(255,255,255,0.14)', quoteBg: 'rgba(255,255,255,0.06)', quoteBorder: '#9fd356', quoteText: '#cdddb8' }
    : { text: '#33402a', hr: '#e0dac9', quoteBg: '#f6f8f0', quoteBorder: '#8fbc45', quoteText: '#4a5a3a' };
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank
    if (line.trim() === '') { i++; continue; }

    // horizontal rule
    if (HR.test(line)) { blocks.push(<hr key={key++} style={{ border: 0, borderTop: `1px solid ${pal.hr}`, margin: '1.4rem 0' }} />); i++; continue; }

    // heading
    const hm = line.match(H);
    if (hm) {
      const level = hm[1].length;
      const tag = `h${Math.min(level + 1, 6)}`;
      blocks.push(React.createElement(tag, { key: key++, style: headingStyle(level, dark) }, renderInline(hm[2], `h${key}`)));
      i++; continue;
    }

    // table: header row followed by a separator row
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const headers = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitRow(lines[i])); i++;
      }
      const biasCol = headers.map(h => BIAS_COL.test(h));
      blocks.push(
        <div key={key++} style={{ overflowX: 'auto', margin: '.8rem 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.9rem' }}>
            <thead>
              <tr>
                {headers.map((h, c) => (
                  <th key={c} style={{
                    textAlign: 'left', padding: '.5rem .7rem', background: '#2c4a1e', color: '#f0f7e6',
                    fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '.78rem',
                    textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
                  }}>{renderInline(h, `th${c}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} style={{ background: ri % 2 ? '#faf8f2' : '#fff' }}>
                  {headers.map((_, c) => {
                    const cell = r[c] ?? '';
                    const kind = biasCol[c] ? classifyBias(cell) : null;
                    return (
                      <td key={c} style={{
                        padding: '.5rem .7rem', borderBottom: '1px solid #ece7db',
                        color: '#33402a', verticalAlign: 'top',
                      }}>
                        {kind ? <BiasPill kind={kind} label={cell} /> : renderInline(cell, `td${ri}-${c}`)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // blockquote (consecutive "> " lines)
    if (QUOTE.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) { buf.push(lines[i].match(QUOTE)![1]); i++; }
      blocks.push(
        <blockquote key={key++} style={{
          margin: '.8rem 0', padding: '.5rem 1rem', borderLeft: `3px solid ${pal.quoteBorder}`,
          background: pal.quoteBg, color: pal.quoteText, fontStyle: 'italic', lineHeight: 1.6,
        }}>{renderInline(buf.join(' '), `q${key}`)}</blockquote>,
      );
      continue;
    }

    // lists (unordered / ordered)
    if (UL.test(line) || OL.test(line)) {
      const ordered = OL.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? OL.test(lines[i]) : UL.test(lines[i]))) {
        items.push(lines[i].match(ordered ? OL : UL)![1]); i++;
      }
      const listStyle: React.CSSProperties = { margin: '.5rem 0', paddingLeft: '1.4rem', lineHeight: 1.65 };
      const liStyle: React.CSSProperties = { marginBottom: '.35rem', color: pal.text };
      blocks.push(
        ordered
          ? <ol key={key++} style={listStyle}>{items.map((it, n) => <li key={n} style={liStyle}>{renderInline(it, `li${key}-${n}`)}</li>)}</ol>
          : <ul key={key++} style={listStyle}>{items.map((it, n) => <li key={n} style={liStyle}>{renderInline(it, `li${key}-${n}`)}</li>)}</ul>,
      );
      continue;
    }

    // paragraph: gather until blank line or a block starter
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() !== '' &&
      !H.test(lines[i]) && !HR.test(lines[i]) && !QUOTE.test(lines[i]) &&
      !UL.test(lines[i]) && !OL.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]))
    ) { para.push(lines[i]); i++; }
    blocks.push(
      <p key={key++} style={{ margin: '0 0 .85rem', lineHeight: 1.7, color: pal.text }}>
        {para.map((ln, n) => (
          <React.Fragment key={n}>
            {n > 0 && <br />}
            {renderInline(ln, `p${key}-${n}`)}
          </React.Fragment>
        ))}
      </p>,
    );
  }

  return <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.95rem', color: pal.text }}>{blocks}</div>;
}

export default Markdown;
