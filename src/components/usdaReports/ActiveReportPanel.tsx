'use client';

import YieldEstimatorPanel from './YieldEstimatorPanel';
import PlantingEstimatorPanel from './PlantingEstimatorPanel';
import LivestockInventoryPanel from './LivestockInventoryPanel';
import { ReportDef } from './reportDefs';

interface Props { active: ReportDef; }

/**
 * Dispatches to the right panel based on report `kind`. The `key` on each
 * panel is the ReportDef value so that switching tabs forces a remount —
 * panels carry internal state that should reset between commodities.
 */
export default function ActiveReportPanel({ active }: Props) {
  if (active.kind === 'YIELD') {
    return (
      <YieldEstimatorPanel
        key={active.value}
        commodity={active.commodity}
        commodityLabel={active.commodityLabel}
        unit={active.unit}
      />
    );
  }
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
