'use client';

import styles from '@/src/styles/farm.module.css';
import SeedPopulationCalc from './SeedPopulationCalc';
import SprayerGpaCalc from './SprayerGpaCalc';
import GrainShrinkCalc from './GrainShrinkCalc';
import CashRentCalc from './CashRentCalc';
import LoanCalc from './LoanCalc';

/**
 * /calculators top — intro section followed by every calculator stacked.
 * Each calculator is its own focused component; adding a new one is just an
 * import + a new line in the render.
 */
export default function CalculatorsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span>🧮</span>
          <h2>Farm Calculators</h2>
        </div>
        <div className={styles.sectionBody}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: '.85rem', color: '#666', margin: 0 }}>
            Quick math you reach for through the season — seed populations, sprayer rates,
            grain shrink, breakeven rent, and loan payments. All results update as you type.
          </p>
        </div>
      </div>

      <SeedPopulationCalc />
      <SprayerGpaCalc />
      <GrainShrinkCalc />
      <CashRentCalc />
      <LoanCalc />
    </div>
  );
}
