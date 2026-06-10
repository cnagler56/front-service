'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CropProgressData, User } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

interface Props {
  rows: CropProgressData[];
  user: User | null;
}

/** "PCT PLANTED" → "Planted" */
function stageLabel(unit: string): string {
  const u = (unit || '').toUpperCase().replace(/^PCT\s+/, '');
  return u.charAt(0) + u.substring(1).toLowerCase();
}

/** Traffic-light shading for a % cell. */
function cellStyle(pct: number | null): React.CSSProperties {
  if (pct == null) return {};
  const bg =
    pct >= 80 ? 'rgba(60, 130, 50, 0.18)'
    : pct >= 50 ? 'rgba(220, 170, 30, 0.20)'
    : 'rgba(190, 50, 50, 0.16)';
  return { background: bg, fontWeight: 600 };
}

function toNum(v: string | undefined | null): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function fmtWeek(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return m && d ? `${parseInt(m, 10)}/${parseInt(d, 10)}` : iso;
}

/**
 * Crop Progress pivot view — sticky week selector + sticky column headers
 * + sticky-left state column.
 *
 * Renders WITHOUT a wrapping `.section` (which has `overflow: hidden` and
 * traps `position: sticky`). Instead we use `.sectionOpen` which keeps the
 * card look but lets the sticky bars stick to the viewport.
 */
export default function CropProgressTable({ rows, user }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const weeks = Array.from(new Set(rows.map(r => r.weekEnding).filter(Boolean))).sort();
    return weeks[weeks.length - 1] ?? '';
  });

  // Measure the actual height of the sticky week bar so the column headers
  // can stick exactly at its bottom edge. Static `top: 64px` was wrong because
  // the bar is ~72–76px tall depending on font/zoom, leading to the headers
  // partially hiding behind the bar's bottom as you scroll.
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barHeight, setBarHeight] = useState(72);
  useLayoutEffect(() => {
    if (!barRef.current) return;
    const el = barRef.current;
    const update = () => setBarHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Available weeks, sorted ascending
  const weeks = useMemo(
    () => Array.from(new Set(rows.map(r => r.weekEnding).filter(Boolean))).sort(),
    [rows],
  );

  // Stages available for the selected week (don't show columns with no data)
  const stages = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.weekEnding === selectedWeek) set.add(r.unit);
    return Array.from(set).sort();
  }, [rows, selectedWeek]);

  // Pivot: state × stage for the selected week
  const pivot = useMemo(() => {
    const states = Array.from(new Set(
      rows.filter(r => r.weekEnding === selectedWeek).map(r => r.state),
    )).sort();
    const byKey = new Map<string, number>();
    for (const r of rows) {
      if (r.weekEnding !== selectedWeek) continue;
      const n = toNum(r.value);
      if (n == null) continue;
      byKey.set(`${r.state}|${r.unit}`, n);
    }
    return { states, byKey };
  }, [rows, selectedWeek]);

  return (
    <div className={styles.sectionOpen}>
      {/*
        Week selector — sticky to the viewport. Lives directly inside `.sectionOpen`
        which uses `overflow: visible`, so sticky works against the page scroll.
      */}
      <div ref={barRef} className={styles.stickyWeekBar}>
        <div className={styles.stickyWeekLabel}>
          Week ending — selected{' '}
          <strong style={{ color: '#2c4a1e' }}>{fmtWeek(selectedWeek)}</strong>
        </div>
        <div className={styles.stickyWeekPills}>
          {[...weeks].reverse().map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWeek(w)}
              className={`${styles.filterPill} ${selectedWeek === w ? styles.filterPillActive : ''}`}
              style={{ flex: '0 0 auto' }}
            >
              {fmtWeek(w)}
            </button>
          ))}
        </div>
      </div>

      {/* Pivot table — no wrapping overflow, so the thead can stick */}
      <table className={`${styles.table} ${styles.stickyHeadTable}`}>
        <thead>
          <tr>
            <th className={styles.stickyCornerHead} style={{ top: barHeight }}>State</th>
            {stages.map(u => (
              <th key={u} className={styles.stickyColHead} style={{ top: barHeight }}>
                {stageLabel(u)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pivot.states.map(st => {
            const isUserState = (user?.state ?? '').trim().toUpperCase() === st.toUpperCase();
            return (
              <tr key={st} style={isUserState ? { background: 'rgba(143, 188, 69, 0.12)' } : {}}>
                <td
                  className={styles.stickyRowHead}
                  style={isUserState
                    ? { background: '#eef5e0', fontWeight: 700 }
                    : undefined}
                >
                  {st}{isUserState ? ' ⭐' : ''}
                </td>
                {stages.map(u => {
                  const v = pivot.byKey.get(`${st}|${u}`);
                  return (
                    <td key={u} style={{ textAlign: 'center', ...cellStyle(v ?? null) }}>
                      {v != null ? `${v}%` : '—'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
}
