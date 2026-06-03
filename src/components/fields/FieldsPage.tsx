'use client';

import { useEffect, useState } from 'react';
import { api, FieldRecord } from '@/src/lib/api';
import { useStoredUser } from '@/src/lib/useStoredUser';
import FieldCard from './FieldCard';
import FieldFormModal from './FieldFormModal';
import FieldsTotalsBar from './FieldsTotalsBar';
import styles from '@/src/styles/farm.module.css';

/**
 * /fields top — gates on having a signed-in user, lists their fields,
 * and owns the add/edit modal. Per-field rendering and the totals strip
 * are delegated to the child components.
 */
export default function FieldsPage() {
  const user = useStoredUser();
  const [fields, setFields]   = useState<FieldRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<{ open: boolean; editing: FieldRecord | null }>(
    { open: false, editing: null }
  );

  // Load the user's fields once we have a user
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
          {!user ? (
            <p className={styles.empty}>
              Please <a href="/signin" style={{ color: '#3d6b2a', fontWeight: 700 }}>sign in</a> to manage your fields.
            </p>
          ) : (
            <>
              <FieldsTotalsBar fields={fields} />

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
