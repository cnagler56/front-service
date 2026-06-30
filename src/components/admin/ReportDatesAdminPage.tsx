'use client';

import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

const REPORTS: { key: string; label: string; hint: string }[] = [
  { key: 'CROP_PRODUCTION', label: 'Crop Production', hint: 'Monthly (Aug–Nov) + Jan annual — your Yield Challenge data.' },
  { key: 'WASDE', label: 'WASDE', hint: 'Monthly supply & demand. Re-ingests on the listed dates.' },
  { key: 'GRAIN_STOCKS', label: 'Grain Stocks', hint: 'Quarterly: late Jan / Mar / Jun 30 / late Sep.' },
];

/** "2026-07-10" → "Fri, Jul 10, 2026". */
function fmt(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso
    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Admin-only page to maintain USDA report release dates. The backend's noon-ET
 * burst refreshes each report only on its listed dates, so data lands within
 * minutes of release. Set several at once from USDA's published calendar.
 */
export default function ReportDatesAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  // reportKey → sorted list of ISO dates
  const [dates, setDates] = useState<Record<string, string[]>>({});
  const [adding, setAdding] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.getReportDates()
      .then((rows) => {
        const grouped: Record<string, string[]> = {};
        for (const r of REPORTS) grouped[r.key] = [];
        for (const row of rows) (grouped[row.reportKey] ??= []).push(row.releaseDate);
        for (const k of Object.keys(grouped)) grouped[k].sort();
        setDates(grouped);
      })
      .catch(() => {});
  }, [isAdmin]);

  function addDate(key: string) {
    const v = (adding[key] || '').trim();
    if (!v) return;
    setDates((prev) => {
      const list = prev[key] ?? [];
      if (list.includes(v)) return prev;
      return { ...prev, [key]: [...list, v].sort() };
    });
    setAdding((prev) => ({ ...prev, [key]: '' }));
  }

  function removeDate(key: string, iso: string) {
    setDates((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((d) => d !== iso) }));
  }

  async function save(key: string, label: string) {
    setBusy(key);
    setMsg(null);
    try {
      const saved = await api.saveReportDates(key, dates[key] ?? []);
      setDates((prev) => ({ ...prev, [key]: saved.map((s) => s.releaseDate).sort() }));
      setMsg({ ok: true, text: `${label} dates saved.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setBusy(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Admins Only</h2></div>
          <div className={styles.sectionBody}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666' }}>
              You need an admin account to manage report release dates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
          Keep these in sync with USDA&rsquo;s published release calendar. On each listed date, the
          report refreshes within minutes of its noon-ET release — no waiting for the next day.
        </p>

        {msg && (
          <div style={{
            background: msg.ok ? '#f0fdf4' : '#fdf0f0',
            border: `1px solid ${msg.ok ? '#27ae60' : '#e74c3c'}`,
            color: msg.ok ? '#1a7f37' : '#c0392b',
            borderRadius: 4, padding: '.7rem .95rem', fontSize: '.88rem',
            marginBottom: '1rem', fontFamily: 'Lato, sans-serif',
          }}>
            {msg.text}
          </div>
        )}

        {REPORTS.map((r) => {
          const list = dates[r.key] ?? [];
          return (
            <div key={r.key} className={styles.section} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.sectionHead}><h2>{r.label}</h2></div>
              <div className={styles.sectionBody}>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.8rem', color: '#6a7a55', margin: '0 0 1rem' }}>
                  {r.hint}
                </p>

                {list.length === 0 ? (
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#888', margin: '0 0 1rem' }}>
                    No dates set — this report falls back to its daily/monthly safety refresh.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>
                    {list.map((iso) => (
                      <span key={iso} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.5rem',
                        fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#2c4a1e',
                        background: '#f0f7e6', border: '1px solid #c9dfa3', borderRadius: 14,
                        padding: '.3rem .4rem .3rem .8rem',
                      }}>
                        {fmt(iso)}
                        <button
                          type="button"
                          aria-label={`Remove ${iso}`}
                          onClick={() => removeDate(r.key, iso)}
                          style={{ background: 'transparent', border: 'none', color: '#6a7a55', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={adding[r.key] || ''}
                    onChange={(e) => setAdding((prev) => ({ ...prev, [r.key]: e.target.value }))}
                    style={{
                      fontFamily: 'Lato, sans-serif', fontSize: '.85rem', padding: '.4rem .55rem',
                      border: '1px solid #d8d3c4', borderRadius: 4,
                    }}
                  />
                  <button className={styles.btnSecondary} onClick={() => addDate(r.key)} type="button">
                    Add date
                  </button>
                  <button
                    className={styles.btn}
                    style={{ marginLeft: 'auto' }}
                    onClick={() => save(r.key, r.label)}
                    disabled={busy === r.key}
                    type="button"
                  >
                    {busy === r.key ? 'Saving…' : `Save ${r.label}`}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
