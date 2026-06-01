'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, FieldRecord, User } from '@/src/lib/api';
import FieldCard from '@/src/components/fields/FieldCard';
import FieldFormModal from '@/src/components/fields/FieldFormModal';
import styles from '@/src/styles/farm.module.css';

export default function FieldsPage() {
  const [user, setUser]       = useState<User | null>(null);
  const [fields, setFields]   = useState<FieldRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<{ open: boolean; editing: FieldRecord | null }>({ open: false, editing: null });

  // Pull stored user
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('agri_user') : null;
      if (stored) setUser(JSON.parse(stored) as User);
    } catch { /* ignore */ }
  }, []);

  // Load this user's fields once we have a user
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.listFields(user.userId)
      .then(f => { if (!cancelled) setFields(f); })
      .catch(() => { if (!cancelled) setError('Could not load your fields. Is the server running?'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function handleSave(record: FieldRecord) {
    if (record.id) {
      const updated = await api.updateField(record.id, record);
      setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    } else {
      const created = await api.createField(record);
      setFields(prev => [created, ...prev]);
    }
    setModal({ open: false, editing: null });
  }

  async function handleDelete(record: FieldRecord) {
    if (!record.id) return;
    if (!confirm(`Delete "${record.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteField(record.id);
      setFields(prev => prev.filter(f => f.id !== record.id));
    } catch {
      alert('Could not delete that field.');
    }
  }

  // Roll-up totals
  const totals = useMemo(() => {
    const totalAcres = fields.reduce((sum, f) => sum + (f.acres ?? 0), 0);
    const byCrop = new Map<string, { acres: number; count: number }>();
    for (const f of fields) {
      const k = f.crop ?? 'OTHER';
      const t = byCrop.get(k) ?? { acres: 0, count: 0 };
      t.acres += f.acres ?? 0;
      t.count += 1;
      byCrop.set(k, t);
    }
    return { totalAcres, byCrop: Array.from(byCrop.entries()) };
  }, [fields]);

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.titleGroup}>
            <span>📍</span>
            <h2>My Fields</h2>
          </div>
          {user && (
            <button
              className={styles.headerBtn}
              onClick={() => setModal({ open: true, editing: null })}
            >
              + Add Field
            </button>
          )}
        </div>

        <div className={styles.sectionBody}>
          {!user && (
            <p className={styles.empty}>
              Please <a href="/signin" style={{ color: '#3d6b2a', fontWeight: 700 }}>sign in</a> to manage your fields.
            </p>
          )}

          {user && (
            <>
              {/* Totals strip */}
              {fields.length > 0 && (
                <div style={{
                  background: '#fdfaf4', border: '1px solid #e1dccc', borderRadius: 6,
                  padding: '.75rem 1rem', marginBottom: '1.25rem',
                  display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'baseline',
                  fontFamily: 'Lato, sans-serif',
                }}>
                  <span>
                    <strong style={{ color: '#2c4a1e', fontSize: '1.25rem' }}>{totals.totalAcres.toLocaleString()}</strong>
                    <span style={{ color: '#888', fontSize: '.75rem', marginLeft: '.25rem' }}>acres total</span>
                  </span>
                  <span>
                    <strong style={{ color: '#2c4a1e', fontSize: '1.25rem' }}>{fields.length}</strong>
                    <span style={{ color: '#888', fontSize: '.75rem', marginLeft: '.25rem' }}>field{fields.length === 1 ? '' : 's'}</span>
                  </span>
                  {totals.byCrop.map(([crop, t]) => (
                    <span key={crop} style={{ color: '#444', fontSize: '.85rem' }}>
                      {crop}: <strong>{t.acres.toLocaleString()} ac</strong>{' '}
                      <span style={{ color: '#888' }}>({t.count})</span>
                    </span>
                  ))}
                </div>
              )}

              {error && <p className={styles.error}>{error}</p>}
              {loading && <p className={styles.loading}>Loading fields…</p>}
              {!loading && fields.length === 0 && !error && (
                <p className={styles.empty}>
                  You haven't added any fields yet — click <strong>+ Add Field</strong> to get started.
                  Once a field has a planting date and coordinates, GDD accumulation is tracked automatically.
                </p>
              )}

              <div style={{ display: 'grid', gap: '1rem' }}>
                {fields.map(f => (
                  <FieldCard
                    key={f.id}
                    field={f}
                    onEdit={() => setModal({ open: true, editing: f })}
                    onDelete={() => handleDelete(f)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modal.open && user && (
        <FieldFormModal
          initial={modal.editing}
          userId={user.userId}
          onSave={handleSave}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}
