'use client';

import { useState } from 'react';
import SnapshotPanel from '@/src/components/usdaLookup/SnapshotPanel';
import HistoryPanel from '@/src/components/usdaLookup/HistoryPanel';

/**
 * NASS yield lookup — the former standalone /usda page, now a tab on /usda-reports.
 * Owns the commodity selection shared by the snapshot table and the history chart.
 */
export default function YieldLookupPanel() {
  const [grain, setGrain] = useState('CORN');
  return (
    <>
      <SnapshotPanel grain={grain} onGrainChange={setGrain} />
      <HistoryPanel grain={grain} />
    </>
  );
}
