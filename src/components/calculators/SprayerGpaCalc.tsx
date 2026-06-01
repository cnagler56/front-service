'use client';

import { useMemo, useState } from 'react';
import { CalcCard, Field, Results, ResultRow } from './SeedPopulationCalc';
import styles from './calculators.module.css';

/**
 * Sprayer GPA (gallons per acre) Calculator.
 *
 * Standard formula:
 *   GPA = (5940 × GPM_per_nozzle) / (MPH × nozzle_spacing_inches)
 *
 * Also computes the total flow in GPM across a boom of given width.
 */
export default function SprayerGpaCalc() {
  const [gpm,     setGpm]     = useState(0.4);
  const [mph,     setMph]     = useState(10);
  const [spacing, setSpacing] = useState(20);
  const [boomFt,  setBoomFt]  = useState(60);

  const result = useMemo(() => {
    if (gpm <= 0 || mph <= 0 || spacing <= 0) return null;
    const gpa = (5940 * gpm) / (mph * spacing);
    const nozzleCount = (boomFt * 12) / spacing;
    const totalGpm = nozzleCount * gpm;
    return {
      gpa: Math.round(gpa * 100) / 100,
      nozzleCount: Math.round(nozzleCount),
      totalGpm: Math.round(totalGpm * 100) / 100,
    };
  }, [gpm, mph, spacing, boomFt]);

  return (
    <CalcCard title="💧 Sprayer GPA" subtitle="Application rate from nozzle flow and ground speed">
      <div className={styles.inputs}>
        <Field label="Nozzle flow (GPM per nozzle)"
          value={gpm} onChange={setGpm} min={0} step={0.05} />
        <Field label="Ground speed (mph)"
          value={mph} onChange={setMph} min={0.1} step={0.5} />
        <Field label="Nozzle spacing (inches)"
          value={spacing} onChange={setSpacing} min={1} step={1} />
        <Field label="Boom width (feet, optional)"
          value={boomFt} onChange={setBoomFt} min={0} step={1} />
      </div>
      <Results>
        {result ? (
          <>
            <ResultRow label="Application rate" value={result.gpa} unit="gallons / acre" highlight />
            <ResultRow label="Nozzles on boom"   value={result.nozzleCount} />
            <ResultRow label="Total flow"        value={result.totalGpm} unit="gallons / min" />
          </>
        ) : <p className={styles.empty}>Enter GPM, speed, and spacing.</p>}
      </Results>
    </CalcCard>
  );
}
