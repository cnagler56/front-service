'use client';
import React from 'react';
import styles from './Home.module.css';

/* ── date helpers ─────────────────────────────────────────────────── */
const strip = (t) => new Date(t.getFullYear(), t.getMonth(), t.getDate());
const at = (y, m, d) => new Date(y, m, d);

function nextAnnual(t, m, d) {
  const now = strip(t);
  let dt = at(t.getFullYear(), m, d);
  if (dt < now) dt = at(t.getFullYear() + 1, m, d);
  return dt;
}
function nextMonthlyDay(t, day) {
  const now = strip(t);
  let dt = at(t.getFullYear(), t.getMonth(), day);
  if (dt < now) dt = at(t.getFullYear(), t.getMonth() + 1, day);
  return dt;
}
function nextFromMonths(t, items) {
  const now = strip(t);
  const y = t.getFullYear();
  const cands = [];
  for (const yy of [y, y + 1]) for (const [m, d] of items) cands.push(at(yy, m, d));
  return cands.filter((c) => c >= now).sort((a, b) => a - b)[0];
}
function nthFriday(y, m, n) {
  const first = new Date(y, m, 1);
  const off = (5 - first.getDay() + 7) % 7;
  return new Date(y, m, 1 + off + (n - 1) * 7);
}
function nextThirdFriday(t) {
  const now = strip(t);
  let f = nthFriday(t.getFullYear(), t.getMonth(), 3);
  if (f < now) f = nthFriday(t.getFullYear(), t.getMonth() + 1, 3);
  return f;
}
function nextMonday(t) {
  const d = strip(t);
  const add = (8 - d.getDay()) % 7; // 0 if today is Monday
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
}

/* ── report schedule (USDA NASS / WAOB patterns) ──────────────────── */
function buildReports(t) {
  const month = t.getMonth(); // 0-based
  const list = [
    { name: 'WASDE / Crop Production', icon: '🏛️', approx: true, date: nextMonthlyDay(t, 10) },
    { name: 'Grain Stocks', icon: '📦', approx: true, date: nextFromMonths(t, [[0, 12], [2, 31], [5, 30], [8, 30]]) },
    { name: 'Prospective Plantings', icon: '🌱', date: nextAnnual(t, 2, 31) },
    { name: 'Acreage', icon: '🌾', date: nextAnnual(t, 5, 30) },
    { name: 'Cattle on Feed', icon: '🐄', approx: true, date: nextThirdFriday(t) },
    { name: 'Cattle Inventory', icon: '🐄', date: nextAnnual(t, 0, 31) },
    { name: 'Hogs & Pigs', icon: '🐖', approx: true, date: nextFromMonths(t, [[2, 28], [5, 27], [8, 25], [11, 23]]) },
  ];
  // Crop Progress runs roughly April–November.
  if (month >= 3 && month <= 10) {
    list.push({ name: 'Crop Progress', icon: '🌽', approx: true, date: nextMonday(t) });
  }
  return list.sort((a, b) => a.date - b.date);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const UsdaReportCalendar = () => {
  const today = new Date();
  const reports = buildReports(today).slice(0, 6);
  const now = strip(today);

  return (
    <section className={styles.farmSection}>
      <div className={styles.farmSectionHeader}>
        <h2>Upcoming USDA Reports</h2>
      </div>
      <div className={`${styles.farmSectionBody} ${styles.farmSectionBodyWarm}`} style={{ display: 'block', padding: '0.25rem 0' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {reports.map((r, i) => {
            const days = Math.round((r.date - now) / 86400000);
            return (
              <li key={r.name} style={{
                display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem 1.25rem',
                borderBottom: i === reports.length - 1 ? 'none' : '1px solid #ece6d8',
              }}>
                <div style={{ flex: 1, minWidth: 0, fontFamily: 'Lato, sans-serif' }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#2c4a1e' }}>{r.name}</div>
                  <div style={{ fontSize: '.74rem', color: '#a09684' }}>
                    {r.approx ? '≈ ' : ''}{MONTHS[r.date.getMonth()]} {r.date.getDate()}
                  </div>
                </div>
                <span style={{
                  flex: '0 0 auto', fontFamily: 'Lato, sans-serif', fontSize: '.75rem', fontWeight: 700,
                  color: days <= 2 ? '#b42318' : '#3d6b2a',
                  background: days <= 2 ? 'rgba(180,35,24,0.08)' : 'rgba(143,188,69,0.14)',
                  borderRadius: 12, padding: '.2rem .65rem', whiteSpace: 'nowrap',
                }}>
                  {days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}
                </span>
              </li>
            );
          })}
        </ul>
        <p style={{ margin: '.5rem 1.25rem 0', fontSize: '.68rem', color: '#b0a896', fontFamily: 'Lato, sans-serif' }}>
          ≈ dates are approximate; USDA confirms exact release dates on its calendar.
        </p>
      </div>
    </section>
  );
};

export default UsdaReportCalendar;
