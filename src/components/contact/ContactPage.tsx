'use client';

import { useState } from 'react';
import { api } from '@/src/lib/api';
import styles from '@/src/styles/farm.module.css';

/** Contact Us — a feedback form that stores submissions (with user info) in the DB. */
export default function ContactPage() {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      // Name + email are stamped server-side from the signed-in account.
      await api.submitFeedback({ message: message.trim() });
      setResult({ ok: true, text: 'Thanks! Your feedback was sent — we read every message.' });
      setMessage('');
    } catch {
      setResult({ ok: false, text: 'Sorry, that didn’t go through. Please try again in a moment.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.section} style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className={styles.sectionHead}>
          
          <h2>Contact Us</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', color: '#555', lineHeight: 1.7, margin: '0 0 1.25rem' }}>
            Just4Ag is a community platform for farmers, analysts, and agriculture enthusiasts.
            Have a question, idea, or bug to report? Send it our way.
          </p>

          {result && (
            <div style={{
              background: result.ok ? '#f0fdf4' : '#fdf0f0',
              border: `1px solid ${result.ok ? '#27ae60' : '#e74c3c'}`,
              color: result.ok ? '#27ae60' : '#c0392b',
              borderRadius: 4, padding: '.7rem .95rem', fontSize: '.88rem',
              marginBottom: '1rem', fontFamily: 'Lato, sans-serif',
            }}>
              {result.text}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <label>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                required
                rows={6}
                style={{
                  width: '100%', resize: 'vertical', padding: '.55rem .7rem',
                  border: '1px solid #cdd6bd', borderRadius: 4, fontSize: '.9rem',
                  fontFamily: 'Lato, sans-serif', color: '#1a2e0f',
                }}
              />
            </div>
            <button
              type="submit"
              className={styles.btn}
              disabled={submitting || !message.trim()}
              style={{ width: '100%', textAlign: 'center' }}
            >
              {submitting ? 'Sending…' : '📨 Send Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
