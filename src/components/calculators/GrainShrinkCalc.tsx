'use client';

import { useMemo, useState } from 'react';
import { CalcCard, Field, Results, ResultRow } from './SeedPopulationCalc';
import styles from './calculators.module.css';

/**
 * Grain Shrink Calculator.
 *
 * Two effects when drying:
 *   1. Water loss (moisture shrink):
 *        dry_bu = wet_bu × (100 − wet%) / (100 − target%)
 *   2. Handling shrink — elevators typically dock an extra ~0.5% per point of moisture
 *      removed (configurable here).
 *
 * Default target is 15% (corn marketing standard).
 */
export default function GrainShrinkCalc() {
  const [wetBu,     setWetBu]     = useState(1000);
  const [wetPct,    setWetPct]    = useState(20);
  const [targetPct, setTargetPct] = useState(15);
  const [handlingPctPerPoint, setHandlingPctPerPoint] = useState(0.5);

  const result = useMemo(() => {
    if (wetBu <= 0 || wetPct <= 0 || targetPct <= 0 || wetPct < targetPct
        || targetPct >= 100 || wetPct >= 100) return null;
    const moistureDry = wetBu * (100 - wetPct) / (100 - targetPct);
    const moistureShrinkBu = wetBu - moistureDry;
    const pointsRemoved = wetPct - targetPct;
    const handlingShrinkBu = wetBu * (handlingPctPerPoint / 100) * pointsRemoved;
    const totalDry = moistureDry - handlingShrinkBu;
    const totalShrinkPct = ((wetBu - totalDry) / wetBu) * 100;
    return {
      moistureDry: Math.round(moistureDry * 10) / 10,
      moistureShrinkBu: Math.round(moistureShrinkBu * 10) / 10,
      handlingShrinkBu: Math.round(handlingShrinkBu * 10) / 10,
      totalDry: Math.round(totalDry * 10) / 10,
      totalShrinkPct: Math.round(totalShrinkPct * 100) / 100,
    };
  }, [wetBu, wetPct, targetPct, handlingPctPerPoint]);

  return (
    <CalcCard title="🌾 Grain Shrink" subtitle="Wet bushels → dry bushels after moisture + handling shrink">
      <div className={styles.inputs}>
        <Field label="Wet bushels"
          value={wetBu} onChange={setWetBu} min={0} step={50} />
        <Field label="Wet moisture (%)"
          value={wetPct} onChange={setWetPct} min={1} max={50} step={0.1} />
        <Field label="Target moisture (%)"
          value={targetPct} onChange={setTargetPct} min={1} max={50} step={0.1} />
        <Field label="Handling shrink (%/point)"
          value={handlingPctPerPoint} onChange={setHandlingPctPerPoint} min={0} max={2} step={0.1} />
      </div>
      <Results>
        {result ? (
          <>
            <ResultRow label="Dry bushels (after shrink)" value={result.totalDry} unit="bu" highlight />
            <ResultRow label="Moisture loss"   value={result.moistureShrinkBu} unit="bu" />
            <ResultRow label="Handling shrink" value={result.handlingShrinkBu} unit="bu" />
            <ResultRow label="Total shrink"    value={result.totalShrinkPct} unit="%" />
          </>
        ) : <p className={styles.empty}>Wet moisture must be at or above target moisture.</p>}
      </Results>
    </CalcCard>
  );
}
