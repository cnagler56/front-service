'use client';

import { useState } from 'react';
import { api } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/**
 * Admin-only: promote a user to the ANALYST role (or revoke it) by email, so
 * they can publish analysis and manage their own subscriber list.
 */
export default function AnalystsAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function set(grant: boolean) {
    if (!email.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.setAnalystRole(email.trim(), grant);
      setMsg({ ok: true, text: `${r.email} is now ${r.role}.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed.' });
    } finally { setBusy(false); }
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Admins Only</h2></div>
          <div className={styles.sectionBody}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666' }}>You need an admin account.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className={styles.section}>
          <div className={styles.sectionHead}><h2>Analysis Providers</h2></div>
          <div className={styles.sectionBody} style={{ display: 'block' }}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1rem' }}>
              Grant a user the <strong>Analyst</strong> role so they can publish market analysis and
              manage their own subscriber list from the Analyst Desk. The person must already have a
              Just4Ag account with this email.
            </p>
            {msg && (
              <div style={{
                background: msg.ok ? '#f0fdf4' : '#fdf0f0',
                border: `1px solid ${msg.ok ? '#27ae60' : '#e74c3c'}`,
                color: msg.ok ? '#1a7f37' : '#c0392b',
                borderRadius: 4, padding: '.7rem .95rem', fontSize: '.88rem',
                marginBottom: '1rem', fontFamily: 'Lato, sans-serif',
              }}>{msg.text}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
              <input
                type="email" placeholder="provider@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: '1 1 240px', fontFamily: 'Lato, sans-serif', fontSize: '.9rem', padding: '.55rem .7rem', border: '1px solid #d8d3c4', borderRadius: 4 }}
              />
              <button className={styles.btn} type="button" disabled={busy} onClick={() => set(true)}>
                {busy ? '…' : 'Grant analyst'}
              </button>
              <button className={styles.btnSecondary} type="button" disabled={busy} onClick={() => set(false)}>
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
