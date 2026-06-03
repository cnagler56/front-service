'use client';

import styles from '@/src/styles/farm.module.css';
import { REPORTS, ReportKey } from './reportDefs';

interface Props {
  activeKey: ReportKey;
  onChange: (key: ReportKey) => void;
}

/** Pill row that selects which USDA report is active. */
export default function ReportTabSelector({ activeKey, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.5rem' }}>
      {REPORTS.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={`${styles.filterPill} ${activeKey === r.value ? styles.filterPillActive : ''}`}
          style={{ fontWeight: 600 }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
