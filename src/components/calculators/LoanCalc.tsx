'use client';

import { useMemo, useState } from 'react';
import { CalcCard, Field, Results, ResultRow } from './SeedPopulationCalc';
import styles from './calculators.module.css';

/**
 * Loan Amortization Calculator.
 *
 *   M = P × (r(1+r)^n) / ((1+r)^n − 1)
 *     where r = monthly rate, n = months.
 *
 * Outputs: monthly payment, total interest paid, total payments.
 */
export default function LoanCalc() {
  const [principal, setPrincipal] = useState(250000);
  const [aprPct,    setAprPct]    = useState(7.5);
  const [years,     setYears]     = useState(20);

  const result = useMemo(() => {
    if (principal <= 0 || aprPct <= 0 || years <= 0) return null;
    const r = (aprPct / 100) / 12;
    const n = years * 12;
    const m = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPaid = m * n;
    const totalInterest = totalPaid - principal;
    return {
      monthly: Math.round(m * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
    };
  }, [principal, aprPct, years]);

  const fmt = (n: number) =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <CalcCard title="💵 Loan Amortization" subtitle="Monthly payment and total interest on a fixed-rate loan">
      <div className={styles.inputs}>
        <Field label="Loan amount ($)"
          value={principal} onChange={setPrincipal} min={0} step={1000} />
        <Field label="Interest rate (APR %)"
          value={aprPct} onChange={setAprPct} min={0} step={0.125} />
        <Field label="Term (years)"
          value={years} onChange={setYears} min={1} step={1} />
      </div>
      <Results>
        {result ? (
          <>
            <ResultRow label="Monthly payment" value={fmt(result.monthly)} highlight />
            <ResultRow label="Total interest paid" value={fmt(result.totalInterest)} />
            <ResultRow label="Total of all payments" value={fmt(result.totalPaid)} />
          </>
        ) : <p className={styles.empty}>Enter loan amount, rate, and term.</p>}
      </Results>
    </CalcCard>
  );
}
