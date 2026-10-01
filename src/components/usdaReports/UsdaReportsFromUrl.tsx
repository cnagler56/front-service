'use client';

import { useSearchParams } from 'next/navigation';
import UsdaReportsPage from './UsdaReportsPage';

/**
 * Opens /usda-reports on the tab named in ?report= (e.g. NASS_YIELD, linked
 * from the dashboards' "USDA Yield Lookup"). Reading the param in the browser
 * keeps the page statically rendered; the server page's Suspense fallback
 * shows the default tab until this hydrates.
 */
export default function UsdaReportsFromUrl() {
  const report = useSearchParams().get('report') ?? undefined;
  // key: remount if the param changes while on the page, so the tab follows it.
  return <UsdaReportsPage key={report ?? ''} initialReport={report} />;
}
