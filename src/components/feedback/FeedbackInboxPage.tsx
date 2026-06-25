'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Feedback } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/** "2026-06-17T13:50:55" → "Jun 17, 2026, 1:50 PM" */
function fmtTs(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * /feedback — admin-only inbox of Contact Us submissions. The backend already
 * enforces admin (403 otherwise); this also hides the page client-side and
 * surfaces a friendly message for non-admins who land here directly.
 */
export default function FeedbackInboxPage() {
  const { user, loading: userLoading } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const [rows, setRows] = useState<Feedback[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getFeedback()
      .then(d => { if (!cancelled) setRows(d); })
      .catch(() => { if (!cancelled) setError('Could not load feedback.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (userLoading) {
    return <div className={styles.page}><p className={styles.loading}>Loading…</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Admins Only</h2></div>
          <div className={styles.sectionBody}>
            <p className={styles.empty} style={{ margin: 0 }}>
              This page is restricted. Head back to the{' '}
              <Link href="/home" style={{ color: '#3d6b2a', fontWeight: 700 }}>home page</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          
          <h2>Feedback Inbox</h2>
          {rows && rows.length > 0 && (
            <span style={{
              marginLeft: 'auto', background: '#8fbc45', color: '#1a2e0f',
              borderRadius: 12, padding: '0 .6rem', fontSize: '.72rem', fontWeight: 700,
              fontFamily: 'Lato, sans-serif',
            }}>
              {rows.length} message{rows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className={styles.sectionBody}>
          {error && <p className={styles.error}>{error}</p>}
          {loading && <p className={styles.loading}>Loading feedback…</p>}
          {!loading && rows && rows.length === 0 && (
            <p className={styles.empty}>No feedback submitted yet.</p>
          )}

          {rows && rows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {rows.map(f => (
                <div
                  key={f.id}
                  style={{
                    border: '1px solid #e1dccc', borderRadius: 6, padding: '.85rem 1rem',
                    background: '#fdfaf4', fontFamily: 'Lato, sans-serif',
                  }}
                >
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'baseline',
                    marginBottom: '.4rem',
                  }}>
                    <strong style={{ color: '#2c4a1e' }}>{f.name?.trim() || 'Anonymous'}</strong>
                    {f.email && (
                      <a href={`mailto:${f.email}`} style={{ color: '#3d6b2a', fontSize: '.82rem' }}>
                        {f.email}
                      </a>
                    )}
                    <span style={{
                      fontSize: '.72rem',
                      color: f.userId ? '#3d6b2a' : '#999',
                      border: `1px solid ${f.userId ? '#a8cc78' : '#ddd'}`,
                      borderRadius: 10, padding: '0 .5rem',
                    }}>
                      {f.userId ? `member #${f.userId}` : 'guest'}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '.74rem', color: '#888' }}>
                      {fmtTs(f.date)}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {f.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
