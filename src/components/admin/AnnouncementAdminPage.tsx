'use client';

import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/**
 * Admin-only page to set the home-page announcement. Type a title and message,
 * toggle "Show on home page", and save — it's stored in the DB and shows up
 * immediately, no redeploy. Untick the toggle (or clear the text) to hide it.
 */
export default function AnnouncementAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    api.getAdminAnnouncement()
      .then((a) => {
        setTitle(a.title ?? '');
        setBody(a.body ?? '');
        setActive(!!a.active);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [isAdmin]);

  async function handleSave() {
    setBusy(true);
    setMsg(null);
    try {
      const saved = await api.saveAnnouncement({ title: title.trim(), body: body.trim(), active });
      setActive(!!saved.active);
      setMsg({
        ok: true,
        text: saved.active ? 'Saved — it is now live on the home page.' : 'Saved — hidden from the home page.',
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
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
              You need an admin account to manage the home-page announcement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className={styles.sectionHead}><h2>Home Page Announcement</h2></div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1rem' }}>
            Set a title and message to highlight something on the home page. It appears as a banner
            only while <em>Show on home page</em> is on — turn it off to hide it. Changes are live
            immediately, no redeploy.
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

          <div className={styles.form} style={{ maxWidth: 'none' }}>
            <div className={styles.formRow}>
              <label htmlFor="ann-title">Title</label>
              <input
                id="ann-title"
                type="text"
                value={title}
                maxLength={120}
                placeholder="e.g. Holiday hours / New feature"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <label htmlFor="ann-body">Message</label>
              <textarea
                id="ann-body"
                value={body}
                maxLength={4000}
                rows={6}
                placeholder="What do you want visitors to see?"
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <label style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              fontFamily: 'Lato, sans-serif', fontSize: '.9rem', color: '#2c4a1e', fontWeight: 700,
            }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Show on home page
            </label>

            <button className={styles.btn} onClick={handleSave} disabled={busy || !loaded}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>

          {(title.trim() || body.trim()) && (
            <div style={{ marginTop: '1.75rem' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#6a7a55', marginBottom: '.5rem' }}>
                Preview
              </div>
              <section className={styles.section} style={{ marginBottom: 0, borderColor: '#b7c6d4' }}>
                <div className={styles.sectionHead} style={{ background: 'linear-gradient(135deg, #34536e, #4a6f93)', borderBottom: '2px solid #7ea6c9' }}>
                  <h2>{title.trim() || 'Announcement'}</h2>
                </div>
                {body.trim() && (
                  <div className={styles.sectionBody} style={{ whiteSpace: 'pre-wrap', color: '#1f2933', fontWeight: 400, fontSize: '1rem', lineHeight: 1.7 }}>
                    {body.trim()}
                  </div>
                )}
              </section>
              {!active && (
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.8rem', color: '#a06a00', margin: '.5rem 0 0' }}>
                  Currently hidden — tick “Show on home page” and save to publish.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
