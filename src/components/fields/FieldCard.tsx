'use client';

import { useEffect, useState } from 'react';
import { api, FieldRecord, FIELD_CROPS } from '@/src/lib/api';
import styles from './fields.module.css';

interface Props {
  field: FieldRecord;
  onEdit: () => void;
  onDelete: () => void;
}

const TBASE: Record<string, number> = {
  CORN: 50, SOYBEANS: 50, WHEAT: 32,
};

/** Days between a YYYY-MM-DD date and today, in whole days. */
function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(iso + 'T00:00:00');
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/** Field display + auto-loaded GDD count if we have planting date + coordinates. */
export default function FieldCard({ field, onEdit, onDelete }: Props) {
  const [gdd, setGdd] = useState<number | null>(null);
  const [gddLoading, setGddLoading] = useState(false);

  const days = daysSince(field.plantedOn ?? null);
  const cropMeta = FIELD_CROPS.find(c => c.value === field.crop);

  useEffect(() => {
    if (!field.plantedOn || field.lat == null || field.lon == null || !field.crop) {
      setGdd(null);
      return;
    }
    let cancelled = false;
    setGddLoading(true);
    const base = TBASE[field.crop] ?? 50;
    api.getGdd(field.lat, field.lon, field.plantedOn, base)
      .then(res => { if (!cancelled) setGdd(res.totalGdd ?? null); })
      .catch(() => { if (!cancelled) setGdd(null); })
      .finally(() => { if (!cancelled) setGddLoading(false); });
    return () => { cancelled = true; };
  }, [field.lat, field.lon, field.plantedOn, field.crop]);

  return (
    <div className={styles.fieldCard}>
      <div className={styles.fieldHead}>
        <div className={styles.fieldTitle}>
          <span className={styles.fieldIcon}>{cropMeta?.icon ?? '📍'}</span>
          <div>
            <h3>{field.name}</h3>
            <p className={styles.fieldSub}>
              {cropMeta?.label ?? '—'}
              {field.variety && <span style={{ color: '#888' }}> · {field.variety}</span>}
              {field.acres != null && <span style={{ color: '#888' }}> · {field.acres} ac</span>}
            </p>
          </div>
        </div>
        <div className={styles.fieldActions}>
          <button type="button" onClick={onEdit}   className={styles.iconBtn} title="Edit">✏️</button>
          <button type="button" onClick={onDelete} className={styles.iconBtn} title="Delete">🗑️</button>
        </div>
      </div>

      <div className={styles.fieldStats}>
        <Stat
          label="Planted"
          value={field.plantedOn
            ? new Date(field.plantedOn + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : '—'}
        />
        <Stat
          label="Days since"
          value={days != null ? `${days} d` : '—'}
        />
        <Stat
          label={`GDD (base ${TBASE[field.crop ?? ''] ?? 50})`}
          value={gddLoading ? '…' : gdd != null ? gdd.toLocaleString() : '—'}
          hint={field.lat == null || field.lon == null ? 'add coords' : undefined}
        />
        <Stat
          label="Acres"
          value={field.acres != null ? `${field.acres}` : '—'}
        />
      </div>

      {field.notes && <p className={styles.fieldNotes}>{field.notes}</p>}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  );
}
