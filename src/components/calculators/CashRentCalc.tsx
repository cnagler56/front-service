'use client';

import { useMemo, useState } from 'react';
import { CalcCard, Field, Results, ResultRow } from './SeedPopulationCalc';
import styles from './calculators.module.css';

/**
 * Cash Rent Breakeven Calculator.
 *
 *   gross_revenue  = yield × price
 *   margin_after_costs = gross_revenue − total_costs
 *   breakeven_rent = margin_after_costs − target_profit
 *
 * "Breakeven rent" is the maximum cash rent that still leaves the target profit.
 */
export default function CashRentCalc() {
  const [yieldBu,  setYieldBu]  = useState(200);
  const [price,    setPrice]    = useState(4.5);
  const [costs,    setCosts]    = useState(450);
  const [target,   setTarget]   = useState(50);

  const result = useMemo(() => {
    if (yieldBu <= 0 || price <= 0) return null;
    const gross = yieldBu * price;
    const margin = gross - costs;
    const breakeven = margin - target;
    return {
      gross: Math.round(gross * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      breakeven: Math.round(breakeven * 100) / 100,
    };
  }, [yieldBu, price, costs, target]);

  const fmt = (n: number) =>
    (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <CalcCard title="🏞️ Cash Rent Breakeven" subtitle="Maximum cash rent that still hits your profit goal">
      <div className={styles.inputs}>
        <Field label="Expected yield (bu/acre)"
          value={yieldBu} onChange={setYieldBu} min={0} step={5} />
        <Field label="Expected price ($/bu)"
          value={price} onChange={setPrice} min={0} step={0.1} />
        <Field label="Other costs ($/acre)"
          value={costs} onChange={setCosts} min={0} step={10} suffix="seed, fertilizer, chem, fuel, machinery, etc." />
        <Field label="Target profit ($/acre)"
          value={target} onChange={setTarget} min={0} step={10} />
      </div>
      <Results>
        {result ? (
          <>
            <ResultRow label="Breakeven rent" value={fmt(result.breakeven)} unit="/ acre" highlight />
            <ResultRow label="Gross revenue"  value={fmt(result.gross)}     unit="/ acre" />
            <ResultRow label="Margin after costs" value={fmt(result.margin)} unit="/ acre" />
          </>
        ) : <p className={styles.empty}>Enter yield and price to start.</p>}
      </Results>
    </CalcCard>
  );
}
