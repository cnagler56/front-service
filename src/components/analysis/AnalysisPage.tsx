'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, AnalysisPost } from '@/src/lib/api';
import { useUser } from '@/src/lib/UserContext';
import styles from '@/src/styles/farm.module.css';

/**
 * Reader view of the gated Analysis tab. The backend enforces access (403 for
 * non-subscribers); this shows the feed to entitled readers and a friendly
 * "how to get access" gate to everyone else.
 */
function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AnalysisPage() {
  const { user, loading: userLoading } = useUser();
  const [posts, setPosts] = useState<AnalysisPost[] | null>(null);
  const [gated, setGated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.getAnalysisFeed()
      .then(p => { if (live) { setPosts(p); setGated(false); } })
      .catch(() => { if (live) { setPosts(null); setGated(true); } })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [user]);

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #2c4a1e 0%, #3d6b2a 55%, #2c4a1e 100%)',
          border: '1px solid #1a2e0f', borderRadius: 8, padding: '1.4rem 1.6rem',
          marginBottom: '1.25rem', color: '#f0f7e6',
        }}>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.6rem', margin: '0 0 .3rem' }}>
            Market Analysis
          </h1>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.92rem', color: '#d8ecc0', margin: 0 }}>
            Subscriber commentary and market reads from our analysis partner.
          </p>
        </div>

        {loading && <p className={styles.loading}>Loading analysis…</p>}

        {!loading && gated && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><h2>Subscriber Content</h2></div>
            <div className={styles.sectionBody} style={{ display: 'block' }}>
              <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.6 }}>
                This analysis is available to the provider&rsquo;s subscribers.{' '}
                {user
                  ? <>Your account (<strong>{user.email}</strong>) isn&rsquo;t on the subscriber list yet — contact the analysis provider and ask them to add this email.</>
                  : <><Link href="/signin" style={{ color: '#3d6b2a', fontWeight: 700 }}>Sign in</Link> with the email your provider has on file to view it.</>}
              </p>
            </div>
          </div>
        )}

        {!loading && !gated && posts && posts.length === 0 && (
          <p className={styles.empty}>No analysis has been posted yet — check back soon.</p>
        )}

        {!loading && !gated && posts && posts.map(p => (
          <article key={p.id} className={styles.section} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.sectionHead}>
              <h2>{p.title}</h2>
            </div>
            <div className={styles.sectionBody} style={{ display: 'block' }}>
              <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.76rem', color: '#7a8a65', marginBottom: '.8rem' }}>
                {p.authorName ? `${p.authorName} · ` : ''}{fmtDate(p.publishedAt)}
              </div>
              <div style={{ fontFamily: 'Lato, sans-serif', fontSize: '.95rem', color: '#33402a', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {p.body}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
