'use client';

import { useEffect, useRef, useState } from 'react';
import { api, WasdeAdminStatus } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/** YYYYMM (e.g. 202606) → "Jun 2026". */
function fmtMonth(key: number): string {
  const y = Math.floor(key / 100), m = (key % 100) - 1;
  const d = new Date(y, m, 1);
  return isNaN(d.getTime()) ? String(key) : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/**
 * Admin-only page to upload each month's WASDE machine-readable CSV. The file is
 * stored in the DB and ingested immediately — no redeploy needed.
 */
export default function WasdeAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const [status, setStatus] = useState<WasdeAdminStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.getWasdeAdmin().then(setStatus).catch(() => {});
  }, [isAdmin]);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg({ ok: false, text: 'Choose a CSV file first.' }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const result = await api.uploadWasde(file);
      setStatus(result);
      setMsg({ ok: true, text: `Uploaded and ingested ${file.name}.` });
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Upload failed.' });
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Admins Only</h2></div>
          <div className={styles.sectionBody}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666' }}>
              You need an admin account to manage WASDE data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const months = status?.monthsLoaded ?? [];
  const uploads = status?.uploads ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className={styles.sectionHead}><h2>WASDE Data Upload</h2></div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1rem' }}>
            Upload the monthly USDA WASDE <em>machine-readable</em> CSV
            (<code>oce-wasde-report-data-YYYY-MM-Vn.csv</code>). It&rsquo;s stored and ingested
            immediately, so the Supply &amp; Demand pages update without a redeploy. Re-uploading a
            month replaces it.
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem' }} />
            <button className={styles.btn} onClick={handleUpload} disabled={busy}>
              {busy ? 'Uploading…' : 'Upload & Ingest'}
            </button>
          </div>

          <div style={{ fontFamily: 'Lato, sans-serif' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6a7a55', marginBottom: '.4rem' }}>
              Months currently loaded
            </div>
            {months.length === 0 ? (
              <p style={{ color: '#888', fontSize: '.85rem', margin: 0 }}>None loaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1rem' }}>
                {months.map(m => (
                  <span key={m} style={{
                    fontSize: '.78rem', color: '#33402a', background: '#f3f7ea',
                    border: '1px solid #dde5cd', borderRadius: 14, padding: '.2rem .7rem',
                  }}>
                    {fmtMonth(m)}
                  </span>
                ))}
              </div>
            )}

            {uploads.length > 0 && (
              <>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6a7a55', margin: '.5rem 0 .4rem' }}>
                  Uploaded files
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '.82rem', color: '#555' }}>
                  {uploads.map(u => (
                    <li key={u.filename}>
                      {u.filename}
                      {u.uploadedAt ? ` — ${new Date(u.uploadedAt).toLocaleDateString()}` : ''}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
