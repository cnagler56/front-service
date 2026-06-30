'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalcCard, Field, Results, ResultRow } from './SeedPopulationCalc';
import styles from './calculators.module.css';

/**
 * Loan Amortization Calculator.
 *
 *   M = P × (r(1+r)^n) / ((1+r)^n − 1)
 *     where r = monthly rate, n = months.
 *
 * Outputs: monthly payment, total interest paid, total payments — plus a
 * popup with the full month-by-month amortization schedule.
 */
export default function LoanCalc() {
  const [principal, setPrincipal] = useState(250000);
  const [aprPct,    setAprPct]    = useState(7.5);
  const [years,     setYears]     = useState(20);
  const [showSchedule, setShowSchedule] = useState(false);

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

  // Full month-by-month schedule (uses the unrounded payment to avoid drift;
  // the final row pays off the exact remaining balance).
  const schedule = useMemo(() => {
    if (principal <= 0 || aprPct <= 0 || years <= 0) return [];
    const r = (aprPct / 100) / 12;
    const n = years * 12;
    const m = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = principal;
    const rows: { period: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    for (let i = 1; i <= n; i++) {
      const interest = balance * r;
      let principalPaid = m - interest;
      let payment = m;
      if (i === n) { principalPaid = balance; payment = balance + interest; }
      balance = Math.max(0, balance - principalPaid);
      rows.push({ period: i, payment, principal: principalPaid, interest, balance });
    }
    return rows;
  }, [principal, aprPct, years]);

  // Close the popup on Escape.
  useEffect(() => {
    if (!showSchedule) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSchedule(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSchedule]);

  const fmt = (n: number) =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <CalcCard title="Loan Amortization" subtitle="Monthly payment and total interest on a fixed-rate loan">
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
            <button type="button" className={styles.scheduleBtn} onClick={() => setShowSchedule(true)}>
              View amortization schedule
            </button>
          </>
        ) : <p className={styles.empty}>Enter loan amount, rate, and term.</p>}
      </Results>

      {showSchedule && result && (
        <div
          className={styles.amortOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Amortization schedule"
          onClick={() => setShowSchedule(false)}
        >
          <div className={styles.amortModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.amortHead}>
              <div>
                <h3>Amortization Schedule</h3>
                <p className={styles.amortSummary}>
                  {fmt(principal)} at {aprPct}% over {years} yr · {fmt(result.monthly)}/mo
                </p>
              </div>
              <button
                type="button"
                className={styles.amortClose}
                aria-label="Close"
                onClick={() => setShowSchedule(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.amortScroll}>
              <table className={styles.amortTable}>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Payment</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr
                      key={row.period}
                      className={(row.period - 1) % 12 === 0 ? styles.amortYearStart : undefined}
                    >
                      <td>{row.period}</td>
                      <td>{fmt(row.payment)}</td>
                      <td>{fmt(row.principal)}</td>
                      <td>{fmt(row.interest)}</td>
                      <td>{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </CalcCard>
  );
}
