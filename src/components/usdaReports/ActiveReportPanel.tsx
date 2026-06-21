'use client';

import PlantingEstimatorPanel from './PlantingEstimatorPanel';
import LivestockInventoryPanel from './LivestockInventoryPanel';
import { ReportDef } from './reportDefs';

interface Props { active: ReportDef; }

/**
 * Dispatches to the right panel based on report `kind` (PLANTING or LIVESTOCK).
 * The interactive yield estimators moved to /usda-challenge. The `key` on each
 * panel is the ReportDef value so switching tabs forces a remount — panels
 * carry internal state that should reset between commodities.
 */
export default function ActiveReportPanel({ active }: Props) {
  if (active.kind === 'PLANTING') {
    return (
      <PlantingEstimatorPanel
        key={active.value}
        commodity={active.commodity}
        commodityLabel={active.commodityLabel}
      />
    );
  }
  return (
    <LivestockInventoryPanel
      key={active.value}
      commodity={active.commodity as 'CATTLE' | 'HOGS'}
      commodityLabel={active.commodityLabel}
      icon={active.livestockIcon!}
      categories={active.livestockCategories!}
      months={active.livestockMonths!}
    />
  );
}
