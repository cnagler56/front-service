'use client';

import { useEffect, useState } from 'react';
import { api, SocialStatus, SocialPreview, SocialPost } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/**
 * Admin console for the X (Twitter) auto-poster. Shows whether it's live,
 * previews the copy Claude will write, lets you fire a one-off (dry-run unless
 * enabled), and lists the recent log.
 */
export default function SocialAdminPage() {
  const { user } = useUser();
  const isAdmin = user?.roles === 'ADMIN';

  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [log, setLog] = useState<SocialPost[]>([]);
  const [pageKey, setPageKey] = useState('');       // '' = next in rotation
  const [preview, setPreview] = useState<SocialPreview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'post' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadLog = () => api.getSocialLog().then(setLog).catch(() => {});
  useEffect(() => {
    if (!isAdmin) return;
    api.getSocialStatus().then(setStatus).catch(() => setStatus(null));
    loadLog();
  }, [isAdmin]);

  async function doPreview() {
    setBusy('preview'); setMsg(null);
    try { setPreview(await api.previewSocialPost(pageKey || undefined)); }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Preview failed.' }); }
    finally { setBusy(null); }
  }

  async function doPostNow() {
    setBusy('post'); setMsg(null);
    try {
      const r = await api.postSocialNow(pageKey || undefined);
      setMsg({
        ok: r.status !== 'FAILED',
        text: r.status === 'POSTED' ? `Posted to X (id ${r.tweetId}).`
          : r.status === 'DRYRUN' ? `Dry run — not sent (${r.note}). Copy saved to the log.`
          : `Failed: ${r.note}`,
      });
      await loadLog();
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Post failed.' }); }
    finally { setBusy(null); }
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

  const live = status?.enabled && status?.xConfigured;

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {/* Status */}
        <div className={styles.section}>
          <div className={styles.sectionHead}><h2>X Auto-Poster</h2></div>
          <div className={styles.sectionBody} style={{ display: 'block' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>
              <Chip on={!!status?.enabled} onText="Posting enabled" offText="Posting disabled" />
              <Chip on={!!status?.xConfigured} onText="X credentials set" offText="X credentials missing" />
              <Chip on={!!status?.aiConfigured} onText="AI copy on" offText="AI copy off (templates)" />
            </div>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.88rem', color: '#555', lineHeight: 1.6, margin: 0 }}>
              {live
                ? <>Live — posting <strong>{status?.schedule}</strong> to X, rotating through {status?.pages.length} pages.</>
                : <>Currently in <strong>dry-run</strong>: it composes and logs posts on schedule ({status?.schedule}) but doesn&rsquo;t send.
                    Set the X API keys on the backend and <code>SOCIAL_POSTING_ENABLED=true</code> to go live.</>}
            </p>
          </div>
        </div>

        {msg && (
          <div style={{
            background: msg.ok ? '#f0fdf4' : '#fdf0f0',
            border: `1px solid ${msg.ok ? '#27ae60' : '#e74c3c'}`,
            color: msg.ok ? '#1a7f37' : '#c0392b',
            borderRadius: 4, padding: '.7rem .95rem', fontSize: '.88rem',
            marginBottom: '1rem', fontFamily: 'Lato, sans-serif',
          }}>{msg.text}</div>
        )}

        {/* Compose / test */}
        <div className={styles.section}>
          <div className={styles.sectionHead}><h2>Preview &amp; Test</h2></div>
          <div className={styles.sectionBody} style={{ display: 'block' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <select value={pageKey} onChange={e => setPageKey(e.target.value)}
                style={{ fontFamily: 'Lato, sans-serif', fontSize: '.9rem', padding: '.5rem .6rem', border: '1px solid #d8d3c4', borderRadius: 4 }}>
                <option value="">Next in rotation</option>
                {status?.pages.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <button className={styles.btn} type="button" disabled={busy !== null} onClick={doPreview}>
                {busy === 'preview' ? '…' : 'Preview copy'}
              </button>
              <button className={styles.btnSecondary} type="button" disabled={busy !== null} onClick={doPostNow}
                title={live ? 'Sends a real tweet now' : 'Runs a dry-run (nothing is sent)'}>
                {busy === 'post' ? '…' : live ? 'Post now' : 'Test (dry-run)'}
              </button>
            </div>

            {preview && (
              <div style={{
                background: '#fbfaf5', border: '1px solid #e6dfcd', borderRadius: 6,
                padding: '.9rem 1.1rem', fontFamily: 'Lato, sans-serif',
              }}>
                <div style={{ fontSize: '.72rem', color: '#8a8570', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.4rem' }}>
                  {preview.pageLabel} · {preview.length}/280 chars · {preview.aiUsed ? 'AI-written' : 'template'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#2c4a1e', fontSize: '.95rem', lineHeight: 1.5 }}>{preview.text}</div>
              </div>
            )}
          </div>
        </div>

        {/* Log */}
        <div className={styles.section}>
          <div className={styles.sectionHead}><h2>Recent Posts</h2></div>
          <div className={styles.sectionBody} style={{ display: 'block' }}>
            {log.length === 0 ? (
              <p style={{ fontFamily: 'Lato, sans-serif', color: '#888', fontSize: '.9rem' }}>Nothing yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lato, sans-serif', fontSize: '.84rem' }}>
                <tbody>
                  {log.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f0ece1', verticalAlign: 'top' }}>
                      <td style={{ padding: '.5rem .3rem', whiteSpace: 'nowrap' }}><StatusBadge status={p.status} /></td>
                      <td style={{ padding: '.5rem .5rem', color: '#33402a' }}>
                        <div style={{ fontWeight: 700, color: '#2c4a1e' }}>{p.pageLabel} <span style={{ fontWeight: 400, color: '#9a8f74' }}>· {p.slot}</span></div>
                        <div style={{ color: '#555', marginTop: '.15rem' }}>{p.text}</div>
                        {p.note && <div style={{ color: '#b06a00', fontSize: '.76rem', marginTop: '.2rem' }}>{p.note}</div>}
                      </td>
                      <td style={{ padding: '.5rem .3rem', color: '#9a8f74', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onText, offText }: { on: boolean; onText: string; offText: string }) {
  return (
    <span style={{
      fontSize: '.74rem', fontWeight: 700, fontFamily: 'Lato, sans-serif',
      padding: '.25rem .6rem', borderRadius: 999,
      color: on ? '#1a7f37' : '#9a7b1a',
      background: on ? '#eaf7ee' : '#fbf3d9',
      border: `1px solid ${on ? '#b7e0c3' : '#e6d59a'}`,
    }}>{on ? `✓ ${onText}` : `• ${offText}`}</span>
  );
}

function StatusBadge({ status }: { status: SocialPost['status'] }) {
  const meta = status === 'POSTED' ? { c: '#1a7f37', b: '#eaf7ee', d: '#b7e0c3' }
    : status === 'FAILED' ? { c: '#c0392b', b: '#fdeceb', d: '#f2b8b3' }
    : { c: '#46556a', b: '#eef2f7', d: '#c8d2df' };
  return (
    <span style={{
      fontSize: '.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em',
      padding: '.15rem .5rem', borderRadius: 999, color: meta.c, background: meta.b, border: `1px solid ${meta.d}`,
    }}>{status}</span>
  );
}
