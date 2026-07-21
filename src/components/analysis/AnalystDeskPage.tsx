'use client';

import { useEffect, useState } from 'react';
import { api, AnalysisPost, AnalystSubscriber } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/**
 * Provider console (ANALYST / ADMIN): write & manage analysis posts, and manage
 * the subscriber list that controls who can read them.
 */
export default function AnalystDeskPage() {
  const { user } = useUser();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.getAnalysisAccess().then(a => setAllowed(a.canPublish)).catch(() => setAllowed(false));
  }, [user]);

  if (allowed === null) {
    return <div className={styles.page}><p className={styles.loading}>Loading…</p></div>;
  }
  if (!allowed) {
    return (
      <div className={styles.page}>
        <div className={styles.section} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className={styles.sectionHead}><h2>Analyst Access Required</h2></div>
          <div className={styles.sectionBody}>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666' }}>
              This console is for approved analysis providers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
          Write your market analysis and manage who can read it. Only people on your
          subscriber list (matched by the email they sign in with) can see published posts.
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
        <PostsPanel onMsg={setMsg} />
        <SubscribersPanel onMsg={setMsg} />
      </div>
    </div>
  );
}

/* ── Posts ──────────────────────────────────────────────────────────── */
function PostsPanel({ onMsg }: { onMsg: (m: { ok: boolean; text: string }) => void }) {
  const [posts, setPosts] = useState<AnalysisPost[]>([]);
  const [editing, setEditing] = useState<{ id?: number; title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.getAnalystPosts().then(setPosts).catch(() => {});
  useEffect(() => { load(); }, []);

  async function save(publish: boolean) {
    if (!editing || !editing.title.trim()) { onMsg({ ok: false, text: 'A title is required.' }); return; }
    setBusy(true);
    try {
      await api.saveAnalystPost({ id: editing.id, title: editing.title, body: editing.body, publish });
      setEditing(null);
      await load();
      onMsg({ ok: true, text: publish ? 'Post published.' : 'Draft saved.' });
    } catch (e) {
      onMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    } finally { setBusy(false); }
  }

  async function remove(id: number) {
    setBusy(true);
    try { await api.deleteAnalystPost(id); await load(); onMsg({ ok: true, text: 'Post deleted.' }); }
    catch (e) { onMsg({ ok: false, text: e instanceof Error ? e.message : 'Delete failed.' }); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = {
    width: '100%', fontFamily: 'Lato, sans-serif', fontSize: '.9rem', padding: '.55rem .7rem',
    border: '1px solid #d8d3c4', borderRadius: 4, boxSizing: 'border-box',
  };

  return (
    <div className={styles.section} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.sectionHead}>
        <h2>Analysis Posts</h2>
        {!editing && (
          <button className={styles.btn} style={{ marginLeft: 'auto' }} type="button"
            onClick={() => setEditing({ title: '', body: '' })}>+ New post</button>
        )}
      </div>
      <div className={styles.sectionBody} style={{ display: 'block' }}>
        {editing && (
          <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <input style={input} placeholder="Title" value={editing.title}
              onChange={e => setEditing({ ...editing, title: e.target.value })} />
            <textarea style={{ ...input, minHeight: 220, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Your analysis… (line breaks are preserved)"
              value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })} />
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <button className={styles.btn} type="button" disabled={busy} onClick={() => save(true)}>
                {busy ? 'Saving…' : 'Publish'}
              </button>
              <button className={styles.btnSecondary} type="button" disabled={busy} onClick={() => save(false)}>
                Save draft
              </button>
              <button className={styles.btnSecondary} type="button" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}

        {posts.length === 0 && !editing && (
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#888', fontSize: '.9rem' }}>No posts yet.</p>
        )}
        {posts.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.6rem 0',
            borderTop: '1px solid #f0ece1', fontFamily: 'Lato, sans-serif',
          }}>
            <span style={{
              fontSize: '.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
              padding: '.12rem .5rem', borderRadius: 999,
              color: p.published ? '#1a7f37' : '#9a7b1a',
              background: p.published ? '#eaf7ee' : '#fbf3d9',
              border: `1px solid ${p.published ? '#b7e0c3' : '#e6d59a'}`,
            }}>{p.published ? 'Live' : 'Draft'}</span>
            <span style={{ fontWeight: 700, color: '#2c4a1e', flex: 1 }}>{p.title || '(untitled)'}</span>
            <button className={styles.btnSecondary} type="button"
              onClick={() => setEditing({ id: p.id, title: p.title, body: p.body })}>Edit</button>
            <button type="button" onClick={() => remove(p.id)}
              style={{ background: 'transparent', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '.85rem' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Subscribers ────────────────────────────────────────────────────── */
function SubscribersPanel({ onMsg }: { onMsg: (m: { ok: boolean; text: string }) => void }) {
  const [subs, setSubs] = useState<AnalystSubscriber[]>([]);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.getAnalystSubscribers().then(setSubs).catch(() => {});
  useEffect(() => { load(); }, []);

  async function add() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.addAnalystSubscriber(email.trim(), note.trim() || undefined);
      setEmail(''); setNote(''); await load();
      onMsg({ ok: true, text: 'Subscriber added.' });
    } catch (e) { onMsg({ ok: false, text: e instanceof Error ? e.message : 'Add failed.' }); }
    finally { setBusy(false); }
  }
  async function remove(id: number) {
    setBusy(true);
    try { await api.removeAnalystSubscriber(id); await load(); onMsg({ ok: true, text: 'Subscriber removed.' }); }
    catch (e) { onMsg({ ok: false, text: e instanceof Error ? e.message : 'Remove failed.' }); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = {
    fontFamily: 'Lato, sans-serif', fontSize: '.88rem', padding: '.5rem .65rem',
    border: '1px solid #d8d3c4', borderRadius: 4,
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}><h2>Subscribers</h2></div>
      <div className={styles.sectionBody} style={{ display: 'block' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.82rem', color: '#6a7a55', margin: '0 0 1rem' }}>
          Add the email each customer signs in with. They&rsquo;ll see your published posts as soon as
          they&rsquo;re on this list (they need a Just4Ag account with that email).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <input style={{ ...input, flex: '2 1 240px' }} type="email" placeholder="customer@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input style={{ ...input, flex: '1 1 160px' }} placeholder="Name / farm (optional)"
            value={note} onChange={e => setNote(e.target.value)} />
          <button className={styles.btn} type="button" disabled={busy} onClick={add}>Add</button>
        </div>

        {subs.length === 0 ? (
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#888', fontSize: '.9rem' }}>No subscribers yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lato, sans-serif', fontSize: '.85rem' }}>
            <tbody>
              {subs.map(s => (
                <tr key={s.id} style={{ borderTop: '1px solid #f0ece1' }}>
                  <td style={{ padding: '.45rem .3rem', color: '#2c4a1e', fontWeight: 600 }}>{s.email}</td>
                  <td style={{ padding: '.45rem .3rem', color: '#7a8a65' }}>{s.note ?? ''}</td>
                  <td style={{ padding: '.45rem .3rem', textAlign: 'right' }}>
                    <button type="button" onClick={() => remove(s.id)}
                      style={{ background: 'transparent', border: 'none', color: '#c0392b', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
