'use client';

import { useState } from 'react';
import styles from '@/src/styles/farm.module.css';
import { REPORTS, ReportKey } from './reportDefs';
import ReportTabSelector from './ReportTabSelector';
import ActiveReportPanel from './ActiveReportPanel';

/**
 * /usda-reports top — owns which tab is active and renders the description
 * for the active report. Tab + panel rendering is delegated.
 */
export default function UsdaReportsPage() {
  const [activeKey, setActiveKey] = useState<ReportKey>('CORN_YIELD');
  const active = REPORTS.find(r => r.value === activeKey)!;

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '1.45rem', color: '#2c4a1e', margin: '0 0 .35rem',
        }}>
          🏛️ USDA Reports
        </h1>
        <p style={{
          fontFamily: 'Lato, sans-serif', color: '#666', fontSize: '.875rem',
          margin: '0 0 .9rem', lineHeight: 1.6,
        }}>
          Interactive USDA / NASS reports. Pick a report, adjust state-level numbers, and watch
          the national rollup respond. Data is cached for ~7 days so we automatically pick up the
          next monthly Crop Production or quarterly Acreage report.
        </p>

        <ReportTabSelector activeKey={activeKey} onChange={setActiveKey} />

        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#888',
          fontStyle: 'italic', margin: 0,
        }}>
          {active.description}
        </p>
      </div>

      <ActiveReportPanel active={active} />
    </div>
  );
}
