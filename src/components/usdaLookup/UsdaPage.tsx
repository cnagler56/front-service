'use client';

import { useState } from 'react';
import styles from '@/src/styles/farm.module.css';
import SnapshotPanel from './SnapshotPanel';
import HistoryPanel from './HistoryPanel';

/**
 * Top of /usda — just owns the commodity selection (shared between the
 * snapshot table and the history chart title) and composes the two panels.
 */
export default function UsdaPage() {
  const [grain, setGrain] = useState('CORN');
  return (
    <div className={styles.page}>
      <SnapshotPanel grain={grain} onGrainChange={setGrain} />
      <HistoryPanel grain={grain} />
    </div>
  );
}
