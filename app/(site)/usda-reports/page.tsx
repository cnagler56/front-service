'use client';

import { useState } from 'react';
import YieldEstimatorPanel from '@/src/components/usdaReports/YieldEstimatorPanel';
import PlantingEstimatorPanel from '@/src/components/usdaReports/PlantingEstimatorPanel';
import LivestockInventoryPanel from '@/src/components/usdaReports/LivestockInventoryPanel';
import {
  CATTLE_CATEGORIES, CATTLE_MONTHS,
  HOGS_CATEGORIES, HOGS_MONTHS,
} from '@/src/components/usdaReports/livestockConfigs';
import styles from '@/src/styles/farm.module.css';

type ReportKey =
  | 'CORN_YIELD'
  | 'SOY_YIELD'
  | 'WHEAT_YIELD'
  | 'CORN_PLANTING'
  | 'SOY_PLANTING'
  | 'WHEAT_PLANTING'
  | 'CATTLE_INV'
  | 'HOGS_INV';

interface ReportDef {
  value: ReportKey;
  label: string;
  description: string;
  kind: 'YIELD' | 'PLANTING' | 'LIVESTOCK';
  commodity: string;
  commodityLabel: string;
  unit?: string;
  // Livestock-only
  livestockIcon?: string;
  livestockMonths?: typeof CATTLE_MONTHS;
  livestockCategories?: typeof CATTLE_CATEGORIES;
}

const REPORTS: ReportDef[] = [
  { value: 'CORN_YIELD',     label: '🌽 Corn — Yield',
    description: 'NASS Crop Production: in-season yield forecasts (Aug-Nov) and final annual estimate.',
    kind: 'YIELD',    commodity: 'CORN',     commodityLabel: 'Corn',     unit: 'bu/acre' },
  { value: 'SOY_YIELD',      label: '🫘 Soybeans — Yield',
    description: 'NASS Crop Production: soybean yield forecasts and final.',
    kind: 'YIELD',    commodity: 'SOYBEANS', commodityLabel: 'Soybeans', unit: 'bu/acre' },
  { value: 'WHEAT_YIELD',    label: '🌾 Wheat — Yield',
    description: 'NASS Crop Production: all-wheat yield forecasts and final.',
    kind: 'YIELD',    commodity: 'WHEAT',    commodityLabel: 'Wheat',    unit: 'bu/acre' },
  { value: 'CORN_PLANTING',  label: '🌽 Corn — Planted Acres',
    description: 'NASS Prospective Plantings (Mar 31) refined by the Acreage report (Jun 30).',
    kind: 'PLANTING', commodity: 'CORN',     commodityLabel: 'Corn' },
  { value: 'SOY_PLANTING',   label: '🫘 Soybeans — Planted Acres',
    description: 'NASS Prospective Plantings + Acreage for soybeans.',
    kind: 'PLANTING', commodity: 'SOYBEANS', commodityLabel: 'Soybeans' },
  { value: 'WHEAT_PLANTING', label: '🌾 Wheat — Planted Acres',
    description: 'NASS Prospective Plantings + Acreage for all wheat.',
    kind: 'PLANTING', commodity: 'WHEAT',    commodityLabel: 'Wheat' },
  { value: 'CATTLE_INV',     label: '🐄 Cattle — Inventory',
    description: 'NASS Cattle Inventory report (Jan 1 annual, Jul 1 mid-year) and Cattle on Feed.',
    kind: 'LIVESTOCK', commodity: 'CATTLE', commodityLabel: 'Cattle',
    livestockIcon: '🐄', livestockMonths: CATTLE_MONTHS, livestockCategories: CATTLE_CATEGORIES },
  { value: 'HOGS_INV',       label: '🐖 Hogs — Inventory',
    description: 'NASS Quarterly Hogs & Pigs report (Mar / Jun / Sep / Dec).',
    kind: 'LIVESTOCK', commodity: 'HOGS', commodityLabel: 'Hogs',
    livestockIcon: '🐖', livestockMonths: HOGS_MONTHS, livestockCategories: HOGS_CATEGORIES },
];

export default function UsdaReportsPage() {
  const [activeKey, setActiveKey] = useState<ReportKey>('CORN_YIELD');
  const active = REPORTS.find(r => r.value === activeKey)!;

  return (
    <div className={styles.page}>
      {/* Header / selector */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '1.45rem', color: '#2c4a1e', margin: '0 0 .35rem',
        }}>
          🏛️ USDA Reports
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', color: '#666', fontSize: '.875rem',
                    margin: '0 0 .9rem', lineHeight: 1.6 }}>
          Interactive USDA / NASS reports. Pick a report, adjust state-level numbers, and watch
          the national rollup respond. Data is cached for ~7 days so we automatically pick up the
          next monthly Crop Production or quarterly Acreage report.
        </p>

        {/* Tab pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.5rem' }}>
          {REPORTS.map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => setActiveKey(r.value)}
              className={`${styles.filterPill} ${activeKey === r.value ? styles.filterPillActive : ''}`}
              style={{ fontWeight: 600 }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.78rem', color: '#888',
                    fontStyle: 'italic', margin: 0 }}>
          {active.description}
        </p>
      </div>

      {/* Panel */}
      {active.kind === 'YIELD' && (
        <YieldEstimatorPanel
          key={active.value}    // remount when commodity changes so internal state resets
          commodity={active.commodity}
          commodityLabel={active.commodityLabel}
          unit={active.unit}
        />
      )}
      {active.kind === 'PLANTING' && (
        <PlantingEstimatorPanel
          key={active.value}
          commodity={active.commodity}
          commodityLabel={active.commodityLabel}
        />
      )}
      {active.kind === 'LIVESTOCK' && (
        <LivestockInventoryPanel
          key={active.value}
          commodity={active.commodity as 'CATTLE' | 'HOGS'}
          commodityLabel={active.commodityLabel}
          icon={active.livestockIcon!}
          categories={active.livestockCategories!}
          months={active.livestockMonths!}
        />
      )}
    </div>
  );
}
