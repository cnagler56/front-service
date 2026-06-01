'use client';

import { useMemo, useState } from 'react';
import styles from './calculators.module.css';

/**
 * Seed Population Calculator.
 *
 * Inputs: target final stand, expected germination %, expected emergence %, row spacing.
 * Outputs: seeding rate (seeds/acre), seeds per foot of row, seeds per 1/1000 acre.
 *
 *   seeding_rate = target_final_stand / (germ% × emerge%)
 *   row_feet_per_acre  = 43,560 / (row_spacing_in / 12)
 *   seeds_per_foot     = seeding_rate / row_feet_per_acre
 *   seeds_per_1000th   = seeding_rate / 1000   (used by precision planters)
 */
export default function SeedPopulationCalc() {
  const [finalStand, setFinalStand] = useState(32000);
  const [germ,       setGerm]       = useState(95);
  const [emerge,     setEmerge]     = useState(95);
  const [spacing,    setSpacing]    = useState(30);

  const result = useMemo(() => {
    if (germ <= 0 || emerge <= 0 || spacing <= 0 || finalStand <= 0) return null;
    const seedingRate = finalStand / ((germ / 100) * (emerge / 100));
    const rowFeetPerAcre = 43560 / (spacing / 12);
    const seedsPerFoot   = seedingRate / rowFeetPerAcre;
    const seedsPer1k     = seedingRate / 1000;
    return {
      seedingRate: Math.round(seedingRate),
      seedsPerFoot: Math.round(seedsPerFoot * 100) / 100,
      seedsPer1k: Math.round(seedsPer1k * 10) / 10,
    };
  }, [finalStand, germ, emerge, spacing]);

  return (
    <CalcCard title="🌱 Seed Population" subtitle="Seeding rate and seeds per row-foot">
      <div className={styles.inputs}>
        <Field label="Target final stand (plants/acre)"
          value={finalStand} onChange={setFinalStand} min={0} step={1000} />
        <Field label="Expected germination (%)"
          value={germ} onChange={setGerm} min={1} max={100} step={1} />
        <Field label="Expected emergence (%)"
          value={emerge} onChange={setEmerge} min={1} max={100} step={1} />
        <Field label="Row spacing (inches)"
          value={spacing} onChange={setSpacing} min={1} max={60} step={1} />
      </div>
      <Results>
        {result ? (
          <>
            <ResultRow label="Seeding rate" value={result.seedingRate.toLocaleString()} unit="seeds / acre" highlight />
            <ResultRow label="Seeds per foot of row" value={result.seedsPerFoot} unit="seeds / ft" />
            <ResultRow label="Seeds per 1/1000 acre" value={result.seedsPer1k} unit="seeds" />
          </>
        ) : <p className={styles.empty}>Fill in all four values to see the seeding rate.</p>}
      </Results>
    </CalcCard>
  );
}

/* ── tiny shared building blocks (also imported by the sibling calcs) ── */

export function CalcCard({ title, subtitle, children }: {
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className={styles.calcCard}>
      <div className={styles.calcCardHead}>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className={styles.calcCardBody}>{children}</div>
    </div>
  );
}

export function Field({
  label, value, onChange, min, max, step, suffix,
}: {
  label: string; value: number;
  onChange: (n: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <span className={styles.inputWrap}>
        <input
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min} max={max} step={step}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </span>
    </label>
  );
}

export function Results({ children }: { children: React.ReactNode }) {
  return <div className={styles.results}>{children}</div>;
}

export function ResultRow({
  label, value, unit, highlight,
}: { label: string; value: number | string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`${styles.resultRow} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.resultLabel}>{label}</span>
      <span className={styles.resultValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className={styles.resultUnit}>{unit}</span>}
      </span>
    </div>
  );
}
