'use client';

import { useMemo } from 'react';
import { FieldRecord } from '@/src/lib/api';

interface Props { fields: FieldRecord[]; }

/**
 * Sand-colored strip at the top of /fields summarizing total acres, field
 * count, and a per-crop breakdown. Returns null when there are no fields
 * so the strip doesn't render an empty container.
 */
export default function FieldsTotalsBar({ fields }: Props) {
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

  if (fields.length === 0) return null;

  return (
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
        <span style={{ color: '#888', fontSize: '.75rem', marginLeft: '.25rem' }}>
          field{fields.length === 1 ? '' : 's'}
        </span>
      </span>
      {totals.byCrop.map(([crop, t]) => (
        <span key={crop} style={{ color: '#444', fontSize: '.85rem' }}>
          {crop}: <strong>{t.acres.toLocaleString()} ac</strong>{' '}
          <span style={{ color: '#888' }}>({t.count})</span>
        </span>
      ))}
    </div>
  );
}
