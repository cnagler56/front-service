'use client';

import { useState, useEffect } from 'react';
import { api, Post } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

export default function BuySellPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    api.getPosts()
      .then(setPosts)
      .catch(() => setError('Failed to load posts. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');
    try {
      const stored = localStorage.getItem('agri_user');
      const user = stored ? JSON.parse(stored) : null;
      await api.addPost({ title, content, name, city, state, userId: user?.userId ?? 0 });
      setSubmitMsg('Post submitted!');
      setTitle(''); setContent(''); setName(''); setCity(''); setState('');
      const updated = await api.getPosts();
      setPosts(updated);
    } catch {
      setSubmitMsg('Failed to submit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>📋</span>
          <h2>Post a Buy / Sell Listing</h2>
        </div>
        <div className={styles.sectionBody}>
          {submitMsg && (
            <p className={submitMsg.includes('Failed') ? styles.error : styles.success}>{submitMsg}</p>
          )}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className={styles.formRow} style={{ flex: 1 }}>
                <label>State</label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Iowa" required />
              </div>
            </div>
            <div className={styles.formRow}>
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Selling 500 bu corn" required />
            </div>
            <div className={styles.formRow}>
              <label>Details</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Describe what you're buying or selling…" required />
            </div>
            <button className={styles.btn} type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post Listing'}
            </button>
          </form>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🗂️</span>
          <h2>Current Listings</h2>
        </div>
        <div className={styles.sectionBody}>
          {loading ? (
            <p className={styles.loading}>Loading…</p>
          ) : posts.length === 0 ? (
            <p className={styles.empty}>No listings yet — post the first one above!</p>
          ) : (
            posts.map(post => (
              <div key={post.idposts} style={{ borderBottom: '1px solid #eee', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: '0 0 .25rem', color: '#2c4a1e', fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem' }}>
                  {post.title}
                </h3>
                <p style={{ margin: '0 0 .5rem', fontSize: '.82rem', color: '#888' }}>
                  {post.name}{post.city ? ` — ${post.city},` : ' —'} {post.state}
                </p>
                <p style={{ margin: 0, fontSize: '.9rem', color: '#555', lineHeight: 1.6 }}>{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
